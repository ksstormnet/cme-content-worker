import { Hono } from "hono";
import { Env, Post, ContentBlock, AIGeneration, APIResponse } from "../../types/database";
import { requireAuth } from "./auth";

export const createRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all create routes
createRoutes.use("*", requireAuth);

// AI Models configuration with cost optimization
const AI_MODELS = {
  cheap: "gpt-3.5-turbo", // For simple tasks, keyword extraction
  standard: "gpt-4o-mini", // For most content generation
  premium: "claude-3.5-sonnet", // For complex content, editing
  fallback: "gpt-3.5-turbo" // If other models fail
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
      model_preference = "standard" 
    } = await c.req.json();

    if (!prompt) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Prompt is required" 
      }, 400);
    }

    const startTime = Date.now();
    let model = AI_MODELS[model_preference as keyof typeof AI_MODELS] || AI_MODELS.standard;
    
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

    let response: string;
    let tokensUsed = 0;
    let costCents = 0;

    try {
      // Try primary model first
      if (model.includes('gpt')) {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        });

        const data = await openaiResponse.json();
        if (!openaiResponse.ok) {
          throw new Error(data.error?.message || 'OpenAI API error');
        }

        response = data.choices[0].message.content;
        tokensUsed = data.usage?.total_tokens || 0;
        
        // Rough cost calculation (adjust based on current pricing)
        if (model === 'gpt-4o-mini') {
          costCents = Math.round(tokensUsed * 0.0015 / 1000 * 100); // $0.0015 per 1K tokens
        } else if (model === 'gpt-3.5-turbo') {
          costCents = Math.round(tokensUsed * 0.0005 / 1000 * 100); // $0.0005 per 1K tokens
        }

      } else if (model.includes('claude')) {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': c.env.CLAUDE_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 2000,
            messages: [
              { role: 'user', content: `${systemPrompt}\n\nUser Request: ${prompt}` }
            ],
          }),
        });

        const data = await claudeResponse.json();
        if (!claudeResponse.ok) {
          throw new Error(data.error?.message || 'Claude API error');
        }

        response = data.content[0].text;
        tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;
        costCents = Math.round(tokensUsed * 0.003 / 1000 * 100); // Rough Claude pricing
      }

    } catch (error) {
      console.error(`${model} failed:`, error);
      // Fallback to cheaper model
      model = AI_MODELS.fallback;
      
      const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      const fallbackData = await fallbackResponse.json();
      response = fallbackData.choices[0].message.content;
      tokensUsed = fallbackData.usage?.total_tokens || 0;
      costCents = Math.round(tokensUsed * 0.0005 / 1000 * 100);
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
        slug, title, content, excerpt, status, post_type, persona, 
        author_id, keywords, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      contentData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      contentData.title,
      JSON.stringify(contentData.content_blocks),
      contentData.excerpt,
      'draft',
      post_type || 'monday',
      persona || null,
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

    // Log AI generation
    await c.env.DB.prepare(`
      INSERT INTO ai_generations (
        post_id, model_used, prompt, response, tokens_used, 
        cost_cents, generation_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      postId,
      model,
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
        model_used: model,
        generation_time_ms: generationTime,
        tokens_used: tokensUsed,
        cost_cents: costCents,
        ...contentData
      },
      message: "Content generated successfully"
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
    const { title, excerpt, content_blocks, keywords, status } = await c.req.json();

    // Update post
    await c.env.DB.prepare(`
      UPDATE posts 
      SET title = ?, excerpt = ?, content = ?, keywords = ?, 
          status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      excerpt || null,
      JSON.stringify(content_blocks),
      JSON.stringify(keywords || []),
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

    const posts = await c.env.DB.prepare(`
      SELECT p.*, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = ?
      ORDER BY p.updated_at DESC
      LIMIT ?
    `).bind(status, limit).all();

    return c.json<APIResponse<Post[]>>({
      success: true,
      data: posts.results || []
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
        content_blocks: blocks.results || []
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