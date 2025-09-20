import { Hono } from "hono";
import { Env, Post, ContentBlock, AIGeneration, APIResponse } from "../../types/database";
import { requireAuth } from "./auth";
import { generateComprehensiveContent, getAPIKeys, TaskType } from "../../utils/ai-models";

export const createRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all create routes
createRoutes.use("*", requireAuth);

// Task-based AI Model Configuration
// ChatGPT (GPT-4o-mini) for planning, Claude (Claude-3.5-sonnet) for writing, DataForSEO for SEO
const TASK_MODELS = {
  planning: "gpt-4o-mini", // Content planning and strategy
  writing: "claude-3.5-sonnet", // Content writing and generation
  seo: "dataforseo", // SEO analysis and optimization
  fallback: "gpt-3.5-turbo" // Emergency fallback
};

// POST /api/create/generate - Generate content using AI
createRoutes.post("/generate", async (c) => {
  try {
    const user = c.get("user");
    const { 
      prompt, 
      post_type, 
      persona, 
      week_themes, 
      task_type = "comprehensive", // planning, writing, seo, or comprehensive
      category_id = 1, // Default to 'General' category
      tag_ids = []
    } = await c.req.json();

    if (!prompt) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Prompt is required" 
      }, 400);
    }

    const startTime = Date.now();
    
    // Build comprehensive prompt based on CME guidelines
    const systemPrompt = `You are an expert content writer for Cruise Made Easy, specializing in Norwegian Cruise Line content.

BRAND GUIDELINES:
- Always write "Norwegian Cruise Line" on first reference, then "Norwegian" or "NCL"
- Ship names: "Norwegian [Ship Name]" (e.g., Norwegian Bliss)
- First-person storytelling from agent POV
- Never invent facts, stories, or testimonials
- Position as NCL authority, not generic cruise agent

POST TYPE: ${post_type}
${post_type === 'monday' ? '- Monday (Awareness): Big picture, wanderlust, seasonal urgency → pivot to future planning' : ''}
${post_type === 'wednesday' ? '- Wednesday (Practical): Evergreen planning expertise, comparisons, myth-busting' : ''}
${post_type === 'friday' ? '- Friday (Aspirational): Milestones, future planning, deep dives' : ''}
${post_type === 'saturday' ? '- Saturday (Inspirational): Wow-factor, lifestyle resonance, shareable quotes' : ''}

${persona ? `PERSONA FOCUS: ${persona} - integrate subtly, avoid formulaic patterns` : ''}
${week_themes ? `WEEK THEMES: ${JSON.stringify(week_themes)}` : ''}

FORMAT OUTPUT AS JSON:
{
  "title": "SEO-optimized title under 60 characters",
  "excerpt": "1-2 sentence summary for meta description",  
  "content_blocks": [
    {"type": "heading", "level": 1, "content": "Main Title"},
    {"type": "paragraph", "content": "Engaging opening paragraph..."},
    {"type": "heading", "level": 2, "content": "Section Header"},
    {"type": "paragraph", "content": "Content paragraph..."},
    {"type": "accent_tip", "content": "Planning tip or key insight"},
    {"type": "image", "alt": "Image description", "caption": "Image caption"},
    {"type": "paragraph", "content": "More content..."},
    {"type": "quote", "content": "Inspirational quote or statistic", "citation": "Source if applicable"},
    {"type": "cta", "text": "Book Your Norwegian Adventure", "url": "/contact", "type": "primary"}
  ],
  "keywords": ["norwegian cruise", "alaska cruises", "cruise planning"],
  "featured_image_suggestion": "Description of ideal featured image"
}`;

    // Get API keys and model settings from database
    const settingsResult = await c.env.DB.prepare(
      "SELECT key, value FROM settings WHERE key IN ('openai_api_key', 'claude_api_key', 'dataforseo_username', 'dataforseo_api_key', 'chatgpt_model', 'claude_model')"
    ).all();
    
    const dbSettings: Record<string, any> = {};
    settingsResult.results?.forEach((setting: any) => {
      try {
        dbSettings[setting.key] = JSON.parse(setting.value);
      } catch {
        dbSettings[setting.key] = setting.value;
      }
    });
    
    const apiKeys = getAPIKeys(c.env, dbSettings);
    
    let response: string;
    let tokensUsed = 0;
    let costCents = 0;
    let modelUsed = '';
    let seoAnalysis = null;

    // Generate content using task-based approach
    try {
      if (task_type === 'comprehensive') {
        // Use all three models: planning -> writing -> SEO
        const result = await generateComprehensiveContent(
          `${systemPrompt}\n\nUser Request: ${prompt}`,
          apiKeys,
          {
            includeWriting: true,
            includeSEO: true,
            settings: dbSettings
          }
        );

        if (result.writing?.success && result.writing.data) {
          response = result.writing.data.response;
          tokensUsed = result.summary.total_time_ms; // Store total time in tokens field for now
          costCents = result.summary.total_cost_cents;
          modelUsed = result.summary.models_used.join(', ');
          seoAnalysis = result.seo?.data?.seo_analysis || null;
        } else if (result.planning?.success && result.planning.data) {
          // Fallback to planning result if writing failed
          response = result.planning.data.response;
          tokensUsed = result.planning.data.tokens_used || 0;
          costCents = result.planning.data.cost_cents || 0;
          modelUsed = result.planning.data.model_used || 'gpt-4o-mini';
        } else {
          throw new Error('All content generation attempts failed');
        }
      } else {
        // Use single task-specific model
        const { generateWithTaskModel } = await import('../../utils/ai-models');
        const taskType = task_type as TaskType;
        const result = await generateWithTaskModel(
          taskType,
          `${systemPrompt}\n\nUser Request: ${prompt}`,
          apiKeys,
          { settings: dbSettings }
        );

        if (result.success && result.data) {
          response = result.data.response;
          tokensUsed = result.data.tokens_used || 0;
          costCents = result.data.cost_cents || 0;
          modelUsed = result.data.model_used || '';
        } else {
          throw new Error(result.error || 'Content generation failed');
        }
      }

    } catch (error) {
      console.error('Content generation error:', error);
      return c.json<APIResponse>({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Content generation failed'
      }, 500);
    }

    const generationTime = Date.now() - startTime;

    // Parse AI response
    let contentData;
    try {
      contentData = JSON.parse(response);
    } catch (error) {
      // If JSON parsing fails, create basic structure
      contentData = {
        title: "Generated Content",
        excerpt: response.substring(0, 160),
        content_blocks: [
          { type: "paragraph", content: response }
        ],
        keywords: [],
        featured_image_suggestion: "Blog post featured image"
      };
    }

    // Create draft post in database
    const postResult = await c.env.DB.prepare(`
      INSERT INTO posts (
        slug, title, content, excerpt, status, post_type, persona, category_id,
        author_id, keywords, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      contentData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      contentData.title,
      JSON.stringify(contentData.content_blocks),
      contentData.excerpt,
      'draft',
      post_type || 'monday',
      persona || null,
      category_id || 1,
      user.id,
      JSON.stringify(contentData.keywords || [])
    ).run();

    const postId = postResult.meta.last_row_id;

    // Save content blocks
    if (contentData.content_blocks && Array.isArray(contentData.content_blocks)) {
      for (let i = 0; i < contentData.content_blocks.length; i++) {
        const block = contentData.content_blocks[i];
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

    // Save post tags
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await c.env.DB.prepare(`
          INSERT INTO post_tags (post_id, tag_id, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).bind(postId, tagId).run();
      }
    }

    // Log AI generation
    await c.env.DB.prepare(`
      INSERT INTO ai_generations (
        post_id, model_used, prompt, response, tokens_used, 
        cost_cents, generation_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      postId,
      modelUsed,
      prompt,
      response,
      tokensUsed,
      costCents,
      generationTime
    ).run();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        post_id: postId,
        model_used: modelUsed,
        generation_time_ms: generationTime,
        tokens_used: tokensUsed,
        cost_cents: costCents,
        task_type: task_type,
        seo_analysis: seoAnalysis,
        ...contentData
      },
      message: `Content generated successfully using ${task_type} approach`
    });

  } catch (error) {
    console.error("Content generation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to generate content" 
    }, 500);
  }
});

// PUT /api/create/posts/:id - Update post content
createRoutes.put("/posts/:id", async (c) => {
  try {
    const postId = c.req.param("id");
    const { title, excerpt, content_blocks, keywords, status, category_id, tag_ids } = await c.req.json();

    // Update post
    await c.env.DB.prepare(`
      UPDATE posts 
      SET title = ?, excerpt = ?, content = ?, keywords = ?, category_id = ?,
          status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      excerpt || null,
      JSON.stringify(content_blocks),
      JSON.stringify(keywords || []),
      category_id || 1,
      status || null,
      postId
    ).run();

    // Delete existing content blocks
    await c.env.DB.prepare(
      "DELETE FROM content_blocks WHERE post_id = ?"
    ).bind(postId).run();

    // Insert updated content blocks
    if (content_blocks && Array.isArray(content_blocks)) {
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

    // Update post tags
    // First delete existing tags
    await c.env.DB.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(postId).run();
    
    // Insert new tags
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await c.env.DB.prepare(`
          INSERT INTO post_tags (post_id, tag_id, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).bind(postId, tagId).run();
      }
    }

    return c.json<APIResponse>({
      success: true,
      message: "Post updated successfully"
    });

  } catch (error) {
    console.error("Post update error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to update post" 
    }, 500);
  }
});

// GET /api/create/posts - Get posts for editorial workflow
createRoutes.get("/posts", async (c) => {
  try {
    const status = c.req.query("status") || "draft";
    const limit = parseInt(c.req.query("limit") || "10");

    // Get posts with category info
    const posts = await c.env.DB.prepare(`
      SELECT 
        p.*, 
        u.name as author_name,
        c.name as category_name,
        c.slug as category_slug,
        c.color as category_color,
        c.icon as category_icon
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = ?
      ORDER BY p.updated_at DESC
      LIMIT ?
    `).bind(status, limit).all();
    
    // Get tags for each post
    const postsWithTags = [];
    for (const post of posts.results || []) {
      const tags = await c.env.DB.prepare(`
        SELECT t.id, t.name, t.slug, t.color
        FROM post_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE pt.post_id = ?
        ORDER BY t.name
      `).bind(post.id).all();

      postsWithTags.push({
        ...post,
        keywords: post.keywords ? JSON.parse(post.keywords) : [],
        tags: tags.results || [],
        category: {
          id: post.category_id,
          name: post.category_name,
          slug: post.category_slug,
          color: post.category_color,
          icon: post.category_icon
        }
      });
    }

    return c.json<APIResponse<Post[]>>({
      success: true,
      data: postsWithTags
    });

  } catch (error) {
    console.error("Posts fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch posts" 
    }, 500);
  }
});

// GET /api/create/posts/:id - Get specific post for editing
createRoutes.get("/posts/:id", async (c) => {
  try {
    const postId = c.req.param("id");

    // Get post with author info
    const post = await c.env.DB.prepare(`
      SELECT p.*, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `).bind(postId).first();

    if (!post) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Post not found" 
      }, 404);
    }

    // Get content blocks
    const blocks = await c.env.DB.prepare(
      "SELECT * FROM content_blocks WHERE post_id = ? ORDER BY block_order"
    ).bind(postId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        ...post,
        content_blocks: blocks.results || [],
        keywords: post.keywords ? JSON.parse(post.keywords) : [],
        tags: post.tags ? JSON.parse(post.tags) : []
      }
    });

  } catch (error) {
    console.error("Post fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch post" 
    }, 500);
  }
});

// GET /api/create/stats - Get post counts by status
createRoutes.get("/stats", async (c) => {
  try {
    const user = c.get("user");

    // Get post counts by status
    const statusCounts = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM posts 
      GROUP BY status
    `).all();

    // Initialize counts with default values
    const counts = {
      draft: 0,
      approved: 0, 
      scheduled: 0,
      published: 0
    };

    // Update counts from database results
    statusCounts.results.forEach((row: any) => {
      if (counts.hasOwnProperty(row.status)) {
        counts[row.status as keyof typeof counts] = row.count;
      }
    });

    return c.json<APIResponse<any>>({
      success: true,
      data: counts
    });

  } catch (error) {
    console.error("Stats fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch statistics" 
    }, 500);
  }
});

// DELETE /api/create/posts/:id - Delete draft post
createRoutes.delete("/posts/:id", async (c) => {
  try {
    const postId = c.req.param("id");

    // Only allow deletion of draft posts
    const post = await c.env.DB.prepare(
      "SELECT status FROM posts WHERE id = ?"
    ).bind(postId).first();

    if (!post) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Post not found" 
      }, 404);
    }

    if (post.status !== 'draft') {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Can only delete draft posts" 
      }, 400);
    }

    // Delete post (content_blocks will cascade delete)
    await c.env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(postId).run();

    return c.json<APIResponse>({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Post deletion error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to delete post" 
    }, 500);
  }
});

// GET /api/create/categories - Get all categories
createRoutes.get("/categories", async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT category, COUNT(*) as count
      FROM posts 
      WHERE status != 'draft'
      GROUP BY category
      ORDER BY count DESC
    `).all();

    return c.json<APIResponse<any[]>>({
      success: true,
      data: categories.results || []
    });

  } catch (error) {
    console.error("Categories fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch categories" 
    }, 500);
  }
});

// GET /api/create/posts/category/:category - Get posts by category
createRoutes.get("/posts/category/:category", async (c) => {
  try {
    const category = c.req.param("category");
    const limit = parseInt(c.req.query("limit") || "10");
    const offset = parseInt(c.req.query("offset") || "0");

    const posts = await c.env.DB.prepare(`
      SELECT p.*, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.category = ? AND p.status = 'published'
      ORDER BY p.updated_at DESC
      LIMIT ? OFFSET ?
    `).bind(category, limit, offset).all();

    // Parse JSON fields
    const postsWithParsedFields = posts.results?.map(post => ({
      ...post,
      keywords: post.keywords ? JSON.parse(post.keywords) : [],
      tags: post.tags ? JSON.parse(post.tags) : []
    })) || [];

    return c.json<APIResponse<Post[]>>({
      success: true,
      data: postsWithParsedFields
    });

  } catch (error) {
    console.error("Category posts fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch category posts" 
    }, 500);
  }
});

// GET /api/create/stats - Get post counts by status
createRoutes.get("/stats", async (c) => {
  try {
    const counts = await c.env.DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM posts 
      GROUP BY status
    `).all();

    // Format the response as an object with status as keys
    const statusCounts = {
      draft: 0,
      approved: 0,
      scheduled: 0,
      published: 0
    };

    // Map database results to the statusCounts object
    if (counts.results) {
      for (const row of counts.results) {
        statusCounts[row.status as keyof typeof statusCounts] = row.count as number;
      }
    }

    return c.json<APIResponse<typeof statusCounts>>({
      success: true,
      data: statusCounts
    });

  } catch (error) {
    console.error("Stats fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch stats" 
    }, 500);
  }
});

// GET /api/create/categories - Get all categories for dropdowns
createRoutes.get("/categories", async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT id, name, slug, description, color, icon, post_count, active
      FROM categories 
      WHERE active = 1
      ORDER BY name
    `).all();

    return c.json<APIResponse<any[]>>({
      success: true,
      data: categories.results || []
    });

  } catch (error) {
    console.error("Categories fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch categories" 
    }, 500);
  }
});

// GET /api/create/tags - Get all tags for dropdowns
createRoutes.get("/tags", async (c) => {
  try {
    const tags = await c.env.DB.prepare(`
      SELECT id, name, slug, description, color, post_count, active
      FROM tags 
      WHERE active = 1
      ORDER BY post_count DESC, name
    `).all();

    return c.json<APIResponse<any[]>>({
      success: true,
      data: tags.results || []
    });

  } catch (error) {
    console.error("Tags fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch tags" 
    }, 500);
  }
});