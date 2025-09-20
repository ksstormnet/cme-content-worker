import { Hono } from "hono";
import { Env, APIResponse } from "../../types/database";
import { requireAuth } from "./auth";
import { generateComprehensiveContent, getAPIKeys } from "../../utils/ai-models";

export const contentAdvancedRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all content routes
contentAdvancedRoutes.use("*", requireAuth);

// Enhanced content generation following CME Writer's Playbook
const CME_SYSTEM_PROMPT = `You are an expert content writer for Cruise Made Easy, specializing in Norwegian Cruise Line content following the comprehensive CME Writer's Playbook.

EDITORIAL MISSION:
- Simplify cruise planning and position Cruise Made Easy as the Norwegian Cruise Line expert
- Content purpose: educate, inspire, build trust (never direct sales)
- Drive awareness → consideration → trust through blog + newsletter

WEEKLY POST ROLES:
- Monday (Awareness): Big picture, wanderlust, seasonal urgency → pivot to future planning
- Wednesday (Practical): Evergreen planning expertise, comparisons, myth-busting  
- Friday (Aspirational): Milestones, future planning, deep dives
- Saturday (Inspirational): Wow-factor, lifestyle resonance, shareable quotes
- Newsletter (Sunday): Digest & bridge with persona-specific elements

BRAND VOICE & STANDARDS:
- First-person storytelling (agent POV)
- Always "Norwegian Cruise Line" on first reference, then "Norwegian" or "NCL"
- Ship names: "Norwegian [Ship Name]" (e.g., Norwegian Bliss)
- Never invent facts, stories, or testimonials
- Conversational, approachable, expert tone

CONTENT STRUCTURE:
- Themes are content beats, not subheading labels
- Vary placement: secondary as sidebar/callout, tertiary as quote/inset
- Never formulaic - randomize but ensure natural flow
- Maximum 2 CTAs: one transactional (booking), one community (quiz/guide)
- Persona cues occasional and subtle, not dominant

SEO & ENGAGEMENT:
- Norwegian Cruise Line destination/milestone keywords
- Curiosity-driven headlines without clickbait
- Fact-rich, structured, semantically varied
- Always optimize for shareability
- Include inspirational/shareable element per post`;

// POST /api/content-advanced/generate-from-plan - Generate content from weekly content plan
contentAdvancedRoutes.post("/generate-from-plan", async (c) => {
  try {
    const user = c.get("user");
    const { 
      plan_id, 
      model_preference = "standard",
      include_seo_analysis = true,
      auto_create_post = true
    } = await c.req.json();

    if (!plan_id) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Content plan ID required" 
      }, 400);
    }

    // Get the content plan with calendar context
    const plan = await c.env.DB.prepare(`
      SELECT wp.*, cc.themes, cc.seasonal_hooks, cc.milestone_hooks, cc.week_start_date, cc.year
      FROM weekly_content_plans wp
      JOIN content_calendar cc ON wp.calendar_id = cc.id
      WHERE wp.id = ?
    `).bind(plan_id).first();

    if (!plan) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Content plan not found" 
      }, 404);
    }

    // Parse context data
    const themes = JSON.parse(plan.themes || '[]');
    const seasonalHooks = JSON.parse(plan.seasonal_hooks || '[]');
    const milestoneHooks = JSON.parse(plan.milestone_hooks || '[]');

    // Build comprehensive prompt based on CME system
    const contentPrompt = buildContentPrompt(plan, themes, seasonalHooks, milestoneHooks);

    // Generate content using selected model
    const generationResult = await generateContentWithModel(
      contentPrompt, 
      model_preference, 
      c.env
    );

    // Create post if requested
    let postId = null;
    if (auto_create_post && generationResult.success) {
      postId = await createPostFromGeneration(
        generationResult.data,
        plan,
        user.id,
        c.env.DB
      );
    }

    // Generate SEO analysis if requested
    let seoAnalysis = null;
    if (include_seo_analysis && generationResult.success) {
      seoAnalysis = await generateSeoAnalysis(
        generationResult.data.title,
        generationResult.data.content_blocks,
        c.env
      );
    }

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        ...generationResult.data,
        post_id: postId,
        seo_analysis: seoAnalysis,
        source_plan: {
          id: plan.id,
          post_day: plan.post_day,
          themes: {
            main: plan.main_theme,
            secondary: plan.secondary_theme,
            tertiary: plan.tertiary_theme
          }
        }
      },
      message: "Content generated from plan successfully"
    });

  } catch (error) {
    console.error("Advanced content generation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to generate content from plan" 
    }, 500);
  }
});

// POST /api/content-advanced/bulk-generate - Generate content for entire week
contentAdvancedRoutes.post("/bulk-generate", async (c) => {
  try {
    const user = c.get("user");
    const { 
      calendar_id,
      post_days = ['monday', 'wednesday', 'friday', 'saturday'], // Exclude newsletter by default
      model_preference = "standard",
      delay_between_generations = 2000 // 2 second delay to avoid rate limits
    } = await c.req.json();

    if (!calendar_id) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Calendar ID required" 
      }, 400);
    }

    // Get all content plans for the week
    const plans = await c.env.DB.prepare(`
      SELECT wp.*, cc.themes, cc.seasonal_hooks, cc.milestone_hooks, cc.week_start_date
      FROM weekly_content_plans wp
      JOIN content_calendar cc ON wp.calendar_id = cc.id
      WHERE wp.calendar_id = ? AND wp.post_day IN (${post_days.map(() => '?').join(',')})
      ORDER BY 
        CASE wp.post_day 
          WHEN 'monday' THEN 1 
          WHEN 'wednesday' THEN 2 
          WHEN 'friday' THEN 3 
          WHEN 'saturday' THEN 4 
          WHEN 'newsletter' THEN 5 
        END
    `).bind(calendar_id, ...post_days).all();

    if (!plans.results || plans.results.length === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "No content plans found for specified days" 
      }, 400);
    }

    const results = [];
    let totalCost = 0;
    let totalTokens = 0;

    // Generate content for each plan with delay
    for (const plan of plans.results) {
      try {
        const themes = JSON.parse(plan.themes || '[]');
        const seasonalHooks = JSON.parse(plan.seasonal_hooks || '[]');
        const milestoneHooks = JSON.parse(plan.milestone_hooks || '[]');

        const contentPrompt = buildContentPrompt(plan, themes, seasonalHooks, milestoneHooks);
        const generationResult = await generateContentWithModel(
          contentPrompt, 
          model_preference, 
          c.env
        );

        if (generationResult.success) {
          // Create post in database
          const postId = await createPostFromGeneration(
            generationResult.data,
            plan,
            user.id,
            c.env.DB
          );

          results.push({
            post_day: plan.post_day,
            success: true,
            post_id: postId,
            title: generationResult.data.title,
            cost_cents: generationResult.data.cost_cents || 0,
            tokens_used: generationResult.data.tokens_used || 0,
            model_used: generationResult.data.model_used
          });

          totalCost += generationResult.data.cost_cents || 0;
          totalTokens += generationResult.data.tokens_used || 0;
        } else {
          results.push({
            post_day: plan.post_day,
            success: false,
            error: generationResult.error || 'Generation failed'
          });
        }

        // Delay before next generation to avoid rate limits
        if (delay_between_generations > 0) {
          await new Promise(resolve => setTimeout(resolve, delay_between_generations));
        }

      } catch (planError) {
        console.error(`Error generating ${plan.post_day}:`, planError);
        results.push({
          post_day: plan.post_day,
          success: false,
          error: planError.message
        });
      }
    }

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        results,
        summary: {
          total_generated: results.filter(r => r.success).length,
          total_failed: results.filter(r => !r.success).length,
          total_cost_cents: totalCost,
          total_tokens: totalTokens,
          average_cost_per_post: results.length > 0 ? Math.round(totalCost / results.length) : 0
        }
      },
      message: `Bulk generation completed: ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} failed`
    });

  } catch (error) {
    console.error("Bulk generation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to perform bulk generation" 
    }, 500);
  }
});

// POST /api/content-advanced/free-form - Create content editor in "go!" mode
contentAdvancedRoutes.post("/free-form", async (c) => {
  try {
    const user = c.get("user");
    const { 
      title,
      content_blocks = [],
      post_type = 'monday',
      persona,
      save_as_draft = true
    } = await c.req.json();

    if (!title) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Title required for free-form content" 
      }, 400);
    }

    // Create post with minimal structure - user will edit in content editor
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const postResult = await c.env.DB.prepare(`
      INSERT INTO posts (
        slug, title, content, excerpt, status, post_type, persona, 
        author_id, keywords, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      slug,
      title,
      JSON.stringify(content_blocks),
      `Free-form content created: ${title}`,
      save_as_draft ? 'draft' : 'approved',
      post_type,
      persona || null,
      user.id,
      JSON.stringify([])
    ).run();

    const postId = postResult.meta.last_row_id;

    // Save content blocks if provided
    if (content_blocks.length > 0) {
      for (let i = 0; i < content_blocks.length; i++) {
        const block = content_blocks[i];
        await c.env.DB.prepare(`
          INSERT INTO content_blocks (post_id, block_type, block_order, content, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          postId,
          block.type,
          i,
          JSON.stringify(block)
        ).run();
      }
    }

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        post_id: postId,
        title: title,
        editor_url: `/create/edit/${postId}`,
        status: save_as_draft ? 'draft' : 'approved'
      },
      message: "Free-form content created successfully"
    });

  } catch (error) {
    console.error("Free-form content creation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to create free-form content" 
    }, 500);
  }
});

// Helper functions
function buildContentPrompt(plan: any, themes: string[], seasonalHooks: string[], milestoneHooks: string[]): string {
  const weekDate = new Date(plan.week_start_date);
  const weekDescription = `Week of ${weekDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })}`;

  return `${CME_SYSTEM_PROMPT}

CONTENT ASSIGNMENT:
Post Day: ${plan.post_day} (${plan.post_type})
Week: ${weekDescription}

THEME INTEGRATION (These are content beats, not subheading labels):
- Main Theme: ${plan.main_theme}
- Secondary Theme: ${plan.secondary_theme} 
- Tertiary Theme: ${plan.tertiary_theme}

SEASONAL CONTEXT:
${seasonalHooks.length > 0 ? `- Seasonal Hooks: ${seasonalHooks.join(', ')}` : ''}
${milestoneHooks.length > 0 ? `- Milestone Hooks: ${milestoneHooks.join(', ')}` : ''}
${themes.length > 0 ? `- Additional Themes: ${themes.join(', ')}` : ''}

CONTENT APPROACH FOR ${plan.post_type.toUpperCase()}:
${getPostTypeGuidance(plan.post_type)}

${plan.content_brief ? `CONTENT BRIEF: ${plan.content_brief}` : ''}

GENERATE a complete blog post following these specifications:
1. Integrate all themes naturally throughout the narrative (vary placement)
2. Write in first-person agent POV with real expertise
3. Include Norwegian Cruise Line specific details and positioning
4. Follow the content approach for ${plan.post_type} posts
5. End with exactly 2 CTAs (one transactional, one community/funnel)
6. Include 1-2 practical callouts or planning tips
7. Optimize for shareability with inspirational elements

OUTPUT FORMAT JSON:
{
  "title": "SEO-optimized title under 60 characters",
  "excerpt": "1-2 sentence summary for meta description",
  "content_blocks": [
    {"type": "heading", "level": 1, "content": "Main Title"},
    {"type": "paragraph", "content": "Opening paragraph with agent POV story..."},
    {"type": "heading", "level": 2, "content": "Section Header"},
    {"type": "paragraph", "content": "Content integrating main theme..."},
    {"type": "accent_tip", "content": "Planning tip or key insight"},
    {"type": "image", "alt": "Norwegian cruise image", "caption": "Image caption"},
    {"type": "paragraph", "content": "Content integrating secondary theme..."},
    {"type": "quote", "content": "Inspirational quote or key stat", "citation": "Source if applicable"},
    {"type": "paragraph", "content": "Content integrating tertiary theme..."},
    {"type": "cta", "text": "Book Your Norwegian Adventure", "url": "/contact", "type": "primary"},
    {"type": "cta", "text": "Take Our Cruise Personality Quiz", "url": "/quiz", "type": "secondary"}
  ],
  "keywords": ["norwegian cruise line", "specific destination", "planning term"],
  "featured_image_suggestion": "Description of ideal featured image",
  "persona_targeting": "${plan.persona || 'general'}"
}`;
}

function getPostTypeGuidance(postType: string): string {
  switch (postType) {
    case 'awareness':
      return 'Focus on big picture appeal, seasonal urgency, and wanderlust. Always pivot to future planning. Use industry timing context.';
    case 'practical':
      return 'Provide evergreen planning expertise, comparisons, and myth-busting. Include actionable tips and NCL-specific guidance.';
    case 'aspirational':
      return 'Connect to milestones and future planning. Include deep dives and forward-looking elements. Aspirational but practical.';
    case 'inspirational':
      return 'Emphasize wow-factor and lifestyle resonance. Include shareable quotes and emotional connection. Visual/inspirational elements.';
    case 'newsletter':
      return 'Weekly digest format with persona-specific intro, featured posts recap, practical cruise tip, and milestone highlight.';
    default:
      return 'Follow general CME content guidelines with engaging storytelling and practical value.';
  }
}

async function generateContentWithModel(prompt: string, modelPreference: string, env: any) {
  // Use the new task-based generation system
  const apiKeys = getAPIKeys(env);
  
  // Load model settings from database
  const settingsResult = await env.DB.prepare(
    "SELECT key, value FROM settings WHERE key IN ('chatgpt_model', 'claude_model')"
  ).all();
  
  const settings: Record<string, any> = {};
  settingsResult.results?.forEach((setting: any) => {
    try {
      settings[setting.key] = JSON.parse(setting.value);
    } catch {
      settings[setting.key] = setting.value;
    }
  });
  
  try {
    // Use comprehensive generation (planning + writing + SEO)
    const result = await generateComprehensiveContent(
      prompt,
      apiKeys,
      {
        includeWriting: true,
        includeSEO: true,
        settings: settings
      }
    );

    if (result.writing?.success && result.writing.data) {
      // Parse the writing response
      let contentData;
      try {
        contentData = JSON.parse(result.writing.data.response);
      } catch (error) {
        contentData = {
          title: "Generated Content",
          excerpt: result.writing.data.response.substring(0, 160),
          content_blocks: [
            { type: "paragraph", content: result.writing.data.response }
          ],
          keywords: [],
          featured_image_suggestion: "Blog post featured image"
        };
      }

      return {
        success: true,
        data: {
          ...contentData,
          model_used: result.summary.models_used.join(', '),
          tokens_used: result.summary.total_time_ms, // Store total time for now
          cost_cents: result.summary.total_cost_cents,
          generation_time_ms: result.summary.total_time_ms,
          seo_analysis: result.seo?.data?.seo_analysis
        }
      };
    } else if (result.planning?.success && result.planning.data) {
      // Fallback to planning result
      let contentData;
      try {
        contentData = JSON.parse(result.planning.data.response);
      } catch (error) {
        contentData = {
          title: "Generated Content",
          excerpt: result.planning.data.response.substring(0, 160),
          content_blocks: [
            { type: "paragraph", content: result.planning.data.response }
          ],
          keywords: [],
          featured_image_suggestion: "Blog post featured image"
        };
      }

      return {
        success: true,
        data: {
          ...contentData,
          model_used: result.planning.data.model_used,
          tokens_used: result.planning.data.tokens_used,
          cost_cents: result.planning.data.cost_cents,
          generation_time_ms: result.planning.data.generation_time_ms
        }
      };
    } else {
      throw new Error('All generation attempts failed');
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Content generation failed'
    };
  }
}

async function createPostFromGeneration(generationData: any, plan: any, userId: number, db: any): Promise<number> {
  const slug = generationData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  const postResult = await db.prepare(`
    INSERT INTO posts (
      slug, title, content, excerpt, status, post_type, persona, 
      author_id, keywords, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    slug,
    generationData.title,
    JSON.stringify(generationData.content_blocks),
    generationData.excerpt,
    'draft',
    plan.post_day,
    plan.persona || null,
    userId,
    JSON.stringify(generationData.keywords || [])
  ).run();

  const postId = postResult.meta.last_row_id;

  // Save content blocks
  if (generationData.content_blocks && Array.isArray(generationData.content_blocks)) {
    for (let i = 0; i < generationData.content_blocks.length; i++) {
      const block = generationData.content_blocks[i];
      await db.prepare(`
        INSERT INTO content_blocks (post_id, block_type, block_order, content, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        postId,
        block.type,
        i,
        JSON.stringify(block)
      ).run();
    }
  }

  return postId;
}

// SEO analysis is now handled by the generateSEOAnalysis function in utils/ai-models.ts

export default contentAdvancedRoutes;