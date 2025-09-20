import { Hono } from "hono";
import { Env, Post, Setting, APIResponse, PaginatedResponse } from "../../types/database";
import { requireAuth } from "./auth";

export const adminRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all admin routes
adminRoutes.use("*", requireAuth);

// GET /api/admin/posts - List all posts with pagination
adminRoutes.get("/posts", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const per_page = parseInt(c.req.query("per_page") || "20");
    const status = c.req.query("status"); // draft, approved, scheduled, published
    const post_type = c.req.query("post_type"); // monday, wednesday, friday, saturday, newsletter
    
    const offset = (page - 1) * per_page;
    
    // Build WHERE clause
    let whereClause = "";
    const bindings: any[] = [];
    
    if (status) {
      whereClause += " WHERE status = ?";
      bindings.push(status);
    }
    
    if (post_type) {
      whereClause += whereClause ? " AND post_type = ?" : " WHERE post_type = ?";
      bindings.push(post_type);
    }

    // Get total count
    const countQuery = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM posts${whereClause}`
    ).bind(...bindings).first();
    
    const total = countQuery?.total || 0;

    // Get posts
    const posts = await c.env.DB.prepare(
      `SELECT p.*, u.name as author_name 
       FROM posts p 
       LEFT JOIN users u ON p.author_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(...bindings, per_page, offset).all();

    return c.json<PaginatedResponse<Post>>({
      success: true,
      data: posts.results || [],
      pagination: {
        page,
        per_page,
        total: total as number,
        total_pages: Math.ceil((total as number) / per_page)
      }
    });

  } catch (error) {
    console.error("Admin posts error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch posts" 
    }, 500);
  }
});

// GET /api/admin/posts/:id - Get specific post
adminRoutes.get("/posts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const post = await c.env.DB.prepare(
      `SELECT p.*, u.name as author_name 
       FROM posts p 
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`
    ).bind(id).first();

    if (!post) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Post not found" 
      }, 404);
    }

    // Get content blocks
    const blocks = await c.env.DB.prepare(
      "SELECT * FROM content_blocks WHERE post_id = ? ORDER BY block_order"
    ).bind(id).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        ...post,
        content_blocks: blocks.results || []
      }
    });

  } catch (error) {
    console.error("Admin post fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch post" 
    }, 500);
  }
});

// PUT /api/admin/posts/:id/status - Update post status
adminRoutes.put("/posts/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status, scheduled_date } = await c.req.json();
    
    if (!["draft", "approved", "scheduled", "published"].includes(status)) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Invalid status" 
      }, 400);
    }

    // Update post status
    const bindings = [status, new Date().toISOString(), id];
    let query = "UPDATE posts SET status = ?, updated_at = ? WHERE id = ?";
    
    if (status === "scheduled" && scheduled_date) {
      query = "UPDATE posts SET status = ?, scheduled_date = ?, updated_at = ? WHERE id = ?";
      bindings.splice(1, 0, scheduled_date);
    }
    
    if (status === "published") {
      query = "UPDATE posts SET status = ?, published_date = ?, updated_at = ? WHERE id = ?";
    }

    await c.env.DB.prepare(query).bind(...bindings).run();

    return c.json<APIResponse>({ 
      success: true, 
      message: `Post ${status} successfully` 
    });

  } catch (error) {
    console.error("Admin status update error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to update post status" 
    }, 500);
  }
});

// GET /api/admin/settings - Get all settings
adminRoutes.get("/settings", async (c) => {
  try {
    const settings = await c.env.DB.prepare(
      "SELECT * FROM settings ORDER BY key"
    ).all();

    const settingsObj: Record<string, any> = {};
    settings.results?.forEach((setting: any) => {
      try {
        // Try to parse JSON values
        settingsObj[setting.key] = JSON.parse(setting.value);
      } catch {
        // If not JSON, store as string
        settingsObj[setting.key] = setting.value;
      }
    });

    return c.json<APIResponse<Record<string, any>>>({
      success: true,
      data: settingsObj
    });

  } catch (error) {
    console.error("Admin settings fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch settings" 
    }, 500);
  }
});

// PUT /api/admin/settings - Update settings
adminRoutes.put("/settings", async (c) => {
  try {
    const settings = await c.req.json();
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await c.env.DB.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET 
          value = excluded.value, 
          updated_at = excluded.updated_at
      `).bind(key, stringValue).run();
    }

    return c.json<APIResponse>({ 
      success: true, 
      message: "Settings updated successfully" 
    });

  } catch (error) {
    console.error("Admin settings update error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to update settings" 
    }, 500);
  }
});

// GET /api/admin/stats - Dashboard statistics
adminRoutes.get("/stats", async (c) => {
  try {
    // Get post counts by status
    const statusCounts = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count 
      FROM posts 
      GROUP BY status
    `).all();

    // Get recent posts
    const recentPosts = await c.env.DB.prepare(`
      SELECT id, title, status, post_type, created_at
      FROM posts 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    // Get AI usage stats
    const aiStats = await c.env.DB.prepare(`
      SELECT 
        model_used,
        COUNT(*) as usage_count,
        SUM(cost_cents) as total_cost_cents,
        AVG(generation_time_ms) as avg_time_ms
      FROM ai_generations 
      WHERE created_at >= date('now', '-30 days')
      GROUP BY model_used
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        post_counts: statusCounts.results || [],
        recent_posts: recentPosts.results || [],
        ai_usage: aiStats.results || []
      }
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch statistics" 
    }, 500);
  }
});