import { Hono } from "hono";
import { Env, APIResponse } from "../../types/database";
import { requireAuth } from "./auth";

export const importRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all import routes
importRoutes.use("*", requireAuth);

interface ContentPlanData {
  week_start_date: string;
  year: number;
  week_number: number;
  monday: { main: string; secondary: string; tertiary: string; };
  wednesday: { main: string; secondary: string; tertiary: string; };
  friday: { main: string; secondary: string; tertiary: string; };
  saturday: { main: string; secondary: string; tertiary: string; };
  newsletter: { themes: string[]; milestone: string; };
}

interface ArticleData {
  title: string;
  content: string;
  post_type: string;
  publish_date: string;
  week_start_date: string;
  seo_keywords?: string[];
}

// POST /api/import/content-plans - Import weekly content plans from markdown files (batch processed)
importRoutes.post("/content-plans", async (c) => {
  try {
    const user = c.get("user");
    const { content_plans_data, batch_size = 3 } = await c.req.json();

    if (!content_plans_data || !Array.isArray(content_plans_data)) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Content plans data required" 
      }, 400);
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process content plans in smaller batches to avoid API limits
    const batchSize = Math.min(batch_size, 3); // Maximum 3 plans per batch
    
    for (let i = 0; i < content_plans_data.length; i += batchSize) {
      const batch = content_plans_data.slice(i, i + batchSize);
      
      for (const planData of batch) {
      try {
        // Create or update calendar entry
        // Calculate sequential week number based on Monday start dates
        const weekNumber = await getSequentialWeekNumber(c.env.DB, planData.week_start_date, content_plans_data);
        
        // Check if calendar entry exists
        const existingCalendar = await c.env.DB.prepare(
          "SELECT id FROM content_calendar WHERE week_start_date = ?"
        ).bind(planData.week_start_date).first();

        let calendarId: number;

        if (existingCalendar) {
          calendarId = existingCalendar.id;
        } else {
          // Create calendar entry
          const calendarResult = await c.env.DB.prepare(`
            INSERT INTO content_calendar (
              week_start_date, year, week_number, status, themes, 
              seasonal_hooks, milestone_hooks, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(
            planData.week_start_date,
            planData.year,
            weekNumber,
            'approved', // Mark imported plans as approved
            JSON.stringify(extractThemesFromPlan(planData)),
            JSON.stringify(extractSeasonalHooks(planData)),
            JSON.stringify(extractMilestoneHooks(planData)),
            user.id
          ).run();

          calendarId = calendarResult.meta.last_row_id as number;
        }

        // Delete existing content plans for this week
        await c.env.DB.prepare(
          "DELETE FROM weekly_content_plans WHERE calendar_id = ?"
        ).bind(calendarId).run();

        // Create content plans for each day
        const days = ['monday', 'wednesday', 'friday', 'saturday', 'newsletter'];
        for (const day of days) {
          const dayData = planData[day];
          if (dayData) {
            const postType = getPostTypeFromDay(day);
            
            await c.env.DB.prepare(`
              INSERT INTO weekly_content_plans (
                calendar_id, post_day, main_theme, secondary_theme, tertiary_theme,
                post_type, persona, content_brief, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).bind(
              calendarId,
              day,
              dayData.main || dayData.themes?.[0] || 'General theme',
              dayData.secondary || dayData.themes?.[1] || 'Secondary theme',
              dayData.tertiary || dayData.themes?.[2] || 'Tertiary theme',
              postType,
              null, // No specific persona in imported plans
              JSON.stringify({
                imported_from: 'content_plan',
                original_structure: dayData,
                post_approach: getContentApproach(postType)
              }),
              'approved'
            ).run();
          }
        }

        importedCount++;
      } catch (error) {
        errors.push(`Week ${planData.week_start_date}: ${error.message}`);
        skippedCount++;
      }
      }
      
      // Add small delay between batches to avoid overwhelming the system
      if (i + batchSize < content_plans_data.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `Imported ${importedCount} content plans, skipped ${skippedCount} (processed in batches of ${batchSize})`
    });

  } catch (error) {
    console.error("Content plans import error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to import content plans" 
    }, 500);
  }
});

// POST /api/import/articles - Import completed articles from markdown files (batch processed)
importRoutes.post("/articles", async (c) => {
  try {
    const user = c.get("user");
    const { articles_data, batch_size = 5 } = await c.req.json();

    if (!articles_data || !Array.isArray(articles_data)) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Articles data required" 
      }, 400);
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process articles in smaller batches to avoid API limits
    const batchSize = Math.min(batch_size, 5); // Maximum 5 articles per batch
    
    for (let i = 0; i < articles_data.length; i += batchSize) {
      const batch = articles_data.slice(i, i + batchSize);
      
      for (const articleData of batch) {
        try {
          // Check if article already exists
          const slug = generateSlugFromTitle(articleData.title);
          const existingPost = await c.env.DB.prepare(
            "SELECT id FROM posts WHERE slug = ?"
          ).bind(slug).first();

          if (existingPost) {
            skippedCount++;
            continue;
          }

          // Convert markdown content to content blocks
          const contentBlocks = parseMarkdownToBlocks(articleData.content);
          
          // Determine status based on scheduled date
          const scheduledDate = new Date(articleData.publish_date);
          const now = new Date();
          const status = scheduledDate > now ? 'scheduled' : 'published';
          
          // Use database transaction for consistency
          const postResult = await c.env.DB.prepare(`
            INSERT INTO posts (
              slug, title, content, excerpt, status, post_type, persona, 
              author_id, keywords, featured_image_url, scheduled_date, 
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(
            slug,
            articleData.title,
            JSON.stringify(contentBlocks),
            generateExcerpt(articleData.content),
            status,
            articleData.post_type,
            null,
            user.id,
            JSON.stringify(articleData.seo_keywords || []),
            extractFeaturedImageSuggestion(articleData.content),
            articleData.publish_date
          ).run();

          const postId = postResult.meta.last_row_id;

          // Batch insert content blocks
          if (contentBlocks && Array.isArray(contentBlocks)) {
            // Prepare all content block inserts
            const blockPromises = contentBlocks.map((block, index) => 
              c.env.DB.prepare(`
                INSERT INTO content_blocks (post_id, block_type, block_order, content, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
              `).bind(
                postId,
                block.type,
                index,
                JSON.stringify(block)
              ).run()
            );
            
            // Execute content block inserts in parallel
            await Promise.all(blockPromises);
          }

          // Create AI generation record for tracking
          await c.env.DB.prepare(`
            INSERT INTO ai_generations (
              post_id, model_used, prompt, response, tokens_used, 
              cost_cents, generation_time_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            postId,
            'imported',
            'Content imported from existing markdown files',
            JSON.stringify(articleData),
            0,
            0,
            0
          ).run();

          importedCount++;
        } catch (error) {
          errors.push(`Article "${articleData.title}": ${error.message}`);
          skippedCount++;
        }
      }
      
      // Add small delay between batches to avoid overwhelming the system
      if (i + batchSize < articles_data.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `Imported ${importedCount} articles, skipped ${skippedCount} (processed in batches of ${batchSize})`
    });

  } catch (error) {
    console.error("Articles import error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to import articles" 
    }, 500);
  }
});

// GET /api/import/validate - Validate import data before processing
importRoutes.post("/validate", async (c) => {
  try {
    const { content_plans_data, articles_data } = await c.req.json();
    
    const validation = {
      content_plans: {
        total: content_plans_data?.length || 0,
        valid: 0,
        invalid: 0,
        errors: [] as string[]
      },
      articles: {
        total: articles_data?.length || 0,
        valid: 0,
        invalid: 0,
        errors: [] as string[]
      }
    };

    // Validate content plans
    if (content_plans_data && Array.isArray(content_plans_data)) {
      for (const plan of content_plans_data) {
        if (validateContentPlan(plan)) {
          validation.content_plans.valid++;
        } else {
          validation.content_plans.invalid++;
          validation.content_plans.errors.push(`Invalid plan for week ${plan.week_start_date || 'unknown'}`);
        }
      }
    }

    // Validate articles
    if (articles_data && Array.isArray(articles_data)) {
      for (const article of articles_data) {
        if (validateArticle(article)) {
          validation.articles.valid++;
        } else {
          validation.articles.invalid++;
          validation.articles.errors.push(`Invalid article: ${article.title || 'untitled'}`);
        }
      }
    }

    return c.json<APIResponse<any>>({
      success: true,
      data: validation,
      message: "Import data validated"
    });

  } catch (error) {
    console.error("Import validation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to validate import data" 
    }, 500);
  }
});

// Helper functions
async function getSequentialWeekNumber(db: any, weekStartDate: string, allPlansData: ContentPlanData[]): Promise<number> {
  // Get all unique Monday dates from the import data and sort them
  const allMondayDates = allPlansData
    .map(plan => plan.week_start_date)
    .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
    .sort(); // Sort chronologically
  
  // Find the position of the current date in the sorted list
  const weekIndex = allMondayDates.indexOf(weekStartDate);
  
  // Return sequential week number (1-based)
  return weekIndex + 1;
}

function getPostTypeFromDay(day: string): string {
  switch (day) {
    case 'monday': return 'awareness';
    case 'wednesday': return 'practical';
    case 'friday': return 'aspirational';
    case 'saturday': return 'inspirational';
    case 'newsletter': return 'newsletter';
    default: return 'awareness';
  }
}

function getContentApproach(postType: string): string {
  switch (postType) {
    case 'awareness': return 'Big picture, wanderlust, seasonal urgency → pivot to future planning';
    case 'practical': return 'Evergreen planning expertise, comparisons, myth-busting';
    case 'aspirational': return 'Milestones, future planning, deep dives';
    case 'inspirational': return 'Wow-factor, lifestyle resonance, shareable quotes';
    case 'newsletter': return 'Weekly digest with persona-specific intro, featured posts recap, practical tip';
    default: return 'General content approach';
  }
}

function extractThemesFromPlan(planData: any): string[] {
  const themes = new Set<string>();
  
  ['monday', 'wednesday', 'friday', 'saturday'].forEach(day => {
    if (planData[day]) {
      if (planData[day].main) themes.add(cleanTheme(planData[day].main));
      if (planData[day].secondary) themes.add(cleanTheme(planData[day].secondary));
      if (planData[day].tertiary) themes.add(cleanTheme(planData[day].tertiary));
    }
  });

  return Array.from(themes);
}

function extractSeasonalHooks(planData: any): string[] {
  const hooks = new Set<string>();
  const themes = extractThemesFromPlan(planData);
  
  themes.forEach(theme => {
    if (theme.includes('Alaska')) hooks.add('Alaska Season');
    if (theme.includes('Canada') || theme.includes('NE')) hooks.add('Fall Foliage');
    if (theme.includes('Mediterranean')) hooks.add('Mediterranean Season');
    if (theme.includes('Caribbean')) hooks.add('Caribbean Season');
    if (theme.includes('Mexican Riviera')) hooks.add('Mexican Riviera Season');
    if (theme.includes('Q4')) hooks.add('Industry Q4 Push');
    if (theme.includes('Hurricane')) hooks.add('Hurricane Season Impact');
    if (theme.includes('Repo')) hooks.add('Repositioning Season');
  });

  return Array.from(hooks);
}

function extractMilestoneHooks(planData: any): string[] {
  // Extract milestone hooks from newsletter milestone highlights
  const hooks = [];
  if (planData.newsletter?.milestone) {
    hooks.push('General Milestones');
  }
  return hooks;
}

function cleanTheme(theme: string): string {
  // Clean theme by removing heat index numbers and extra descriptors
  return theme
    .replace(/\s*\(\d+\)/, '') // Remove (5), (4) etc
    .replace(/as\s+(lead\s+theme|supporting\s+context|callout|sidebar|explainer|practical\s+angle|contrast|comparison|planning\s+tip|insight|milestone|forward-looking\s+piece|deeper\s+way|add-on\s+insight|inspirational\s+angle|wow-factor|quote|visual|short\s+story).*/, '')
    .trim();
}

function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMarkdownToBlocks(content: string): any[] {
  const blocks = [];
  const lines = content.split('\n');
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('# ')) {
      // H1 - Main title
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      blocks.push({ type: 'heading', level: 1, content: line.substring(2) });
    } else if (line.startsWith('## ')) {
      // H2 - Section heading
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      blocks.push({ type: 'heading', level: 2, content: line.substring(3) });
    } else if (line.startsWith('### ')) {
      // H3 - Subsection heading
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      blocks.push({ type: 'heading', level: 3, content: line.substring(4) });
    } else if (line.startsWith('> ')) {
      // Blockquote - convert to accent tip or quote
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      const quoteContent = line.substring(2);
      if (quoteContent.includes('Planning Tip') || quoteContent.includes('Tip:')) {
        blocks.push({ type: 'accent_tip', content: quoteContent });
      } else {
        blocks.push({ type: 'quote', content: quoteContent });
      }
    } else if (line.startsWith('**Featured Image') || line.startsWith('**Secondary Image')) {
      // Image suggestions
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      const imageDesc = line.replace(/\*\*/g, '').replace('Featured Image Suggestion:', '').replace('Secondary Image:', '').trim();
      blocks.push({ 
        type: 'image', 
        alt: imageDesc,
        caption: imageDesc
      });
    } else if (line.includes('[Schedule a Planning Call]') || line.includes('[Take our') || line.includes('[Book ')) {
      // CTAs
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        blocks.push({ 
          type: 'cta', 
          text: linkMatch[1],
          url: linkMatch[2]
        });
      }
    } else if (line !== '' && !line.startsWith('**Optional') && !line.startsWith('NOTE:')) {
      // Regular paragraph content
      if (currentParagraph) currentParagraph += ' ';
      currentParagraph += line;
    } else if (line === '' && currentParagraph) {
      // End of paragraph
      blocks.push({ type: 'paragraph', content: currentParagraph.trim() });
      currentParagraph = '';
    }
  }

  // Add final paragraph if exists
  if (currentParagraph) {
    blocks.push({ type: 'paragraph', content: currentParagraph.trim() });
  }

  return blocks;
}

function generateExcerpt(content: string): string {
  // Extract first paragraph or first 160 characters
  const firstParagraph = content.split('\n').find(line => 
    line.trim() && !line.startsWith('#') && !line.startsWith('>')
  );
  
  if (firstParagraph && firstParagraph.length > 20) {
    return firstParagraph.substring(0, 160) + (firstParagraph.length > 160 ? '...' : '');
  }
  
  return content.substring(0, 160) + '...';
}

function extractFeaturedImageSuggestion(content: string): string | null {
  const imageMatch = content.match(/\*\*Featured Image Suggestion:\*\*\s*(.+)/);
  return imageMatch ? imageMatch[1].trim() : null;
}

function validateContentPlan(plan: any): boolean {
  return !!(
    plan.week_start_date &&
    plan.year &&
    plan.monday &&
    plan.wednesday &&
    plan.friday &&
    plan.saturday
  );
}

function validateArticle(article: any): boolean {
  return !!(
    article.title &&
    article.content &&
    article.post_type &&
    (article.publish_date || article.scheduled_date)
  );
}

export default importRoutes;