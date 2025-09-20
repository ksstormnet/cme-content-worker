import { Hono } from "hono";
import { Env, Post, Setting, User, APIResponse, PaginatedResponse } from "../../types/database";
import { requireAuth } from "./auth";

// Password hashing utility (same as auth.ts)
const hashPassword = async (password: string): Promise<string> => {
  // Simple password hashing for demo - in production use proper bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

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

// GET /api/admin/users - Get all users
adminRoutes.get("/users", async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT id, email, name, role, created_at, last_login, active
      FROM users 
      ORDER BY created_at DESC
    `).all();

    return c.json<APIResponse<User[]>>({
      success: true,
      data: users.results || []
    });

  } catch (error) {
    console.error("Admin users fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch users" 
    }, 500);
  }
});

// POST /api/admin/users - Create new user
adminRoutes.post("/users", async (c) => {
  try {
    const { email, name, role, password } = await c.req.json();
    
    // Validate required fields
    if (!email || !name || !role || !password) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "All fields are required" 
      }, 400);
    }

    // Validate role
    if (!["admin", "editor", "viewer"].includes(role)) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Invalid role" 
      }, 400);
    }

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();

    if (existingUser) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "User with this email already exists" 
      }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, name, role, password_hash, created_at, active)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
    `).bind(email, name, role, passwordHash).run();

    return c.json<APIResponse>({ 
      success: true, 
      message: "User created successfully",
      data: { id: result.meta.last_row_id }
    });

  } catch (error) {
    console.error("Admin user creation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to create user" 
    }, 500);
  }
});

// PUT /api/admin/users/:id - Update user
adminRoutes.put("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { email, name, role, password } = await c.req.json();
    
    // Validate required fields (password is optional for updates)
    if (!email || !name || !role) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Email, name, and role are required" 
      }, 400);
    }

    // Validate role
    if (!["admin", "editor", "viewer"].includes(role)) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Invalid role" 
      }, 400);
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE id = ?"
    ).bind(id).first();

    if (!existingUser) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "User not found" 
      }, 404);
    }

    // Check if email is taken by another user
    const emailCheck = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ? AND id != ?"
    ).bind(email, id).first();

    if (emailCheck) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Email is already taken by another user" 
      }, 400);
    }

    // Update user
    let query = `
      UPDATE users 
      SET email = ?, name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    let bindings = [email, name, role, id];

    // If password provided, hash and include in update
    if (password) {
      const passwordHash = await hashPassword(password);
      query = `
        UPDATE users 
        SET email = ?, name = ?, role = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      bindings = [email, name, role, passwordHash, id];
    }

    await c.env.DB.prepare(query).bind(...bindings).run();

    return c.json<APIResponse>({ 
      success: true, 
      message: "User updated successfully" 
    });

  } catch (error) {
    console.error("Admin user update error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to update user" 
    }, 500);
  }
});

// DELETE /api/admin/users/:id - Delete user
adminRoutes.delete("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const currentUser = c.get('user');
    
    // Prevent self-deletion
    if (currentUser.id === parseInt(id)) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Cannot delete your own account" 
      }, 400);
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      "SELECT id, role FROM users WHERE id = ?"
    ).bind(id).first();

    if (!existingUser) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "User not found" 
      }, 404);
    }

    // Check if trying to delete the last admin
    if (existingUser.role === 'admin') {
      const adminCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND active = 1"
      ).first();
      
      if (adminCount && adminCount.count <= 1) {
        return c.json<APIResponse>({ 
          success: false, 
          error: "Cannot delete the last admin user" 
        }, 400);
      }
    }

    // Soft delete - set active to false
    await c.env.DB.prepare(`
      UPDATE users 
      SET active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(id).run();

    return c.json<APIResponse>({ 
      success: true, 
      message: "User deleted successfully" 
    });

  } catch (error) {
    console.error("Admin user deletion error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to delete user" 
    }, 500);
  }
});

// ===== CATEGORY MANAGEMENT =====

// GET /api/admin/categories - Get all categories
adminRoutes.get("/categories", async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT * FROM categories 
      ORDER BY post_count DESC, name
    `).all();

    return c.json<APIResponse<any[]>>({
      success: true,
      data: categories.results || []
    });

  } catch (error) {
    console.error("Admin categories fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch categories" 
    }, 500);
  }
});

// POST /api/admin/categories - Create new category
adminRoutes.post("/categories", async (c) => {
  try {
    const { name, description, color, icon } = await c.req.json();
    
    if (!name) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Category name is required" 
      }, 400);
    }

    // Create URL-safe slug
    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const result = await c.env.DB.prepare(`
      INSERT INTO categories (name, slug, description, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      name,
      slug,
      description || null,
      color || '#6b7280',
      icon || '📝'
    ).run();

    const categoryId = result.meta.last_row_id;
    
    // Get the created category
    const category = await c.env.DB.prepare(
      "SELECT * FROM categories WHERE id = ?"
    ).bind(categoryId).first();

    return c.json<APIResponse<any>>({
      success: true,
      data: category,
      message: "Category created successfully"
    });

  } catch (error) {
    console.error("Admin category creation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to create category" 
    }, 500);
  }
});

// PUT /api/admin/categories/:id - Update category
adminRoutes.put("/categories/:id", async (c) => {
  try {
    const categoryId = c.req.param("id");
    const { name, description, color, icon, active } = await c.req.json();
    
    if (!name) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Category name is required" 
      }, 400);
    }

    // Create URL-safe slug
    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    await c.env.DB.prepare(`
      UPDATE categories 
      SET name = ?, slug = ?, description = ?, color = ?, icon = ?, active = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      slug,
      description,
      color || '#6b7280',
      icon || '📝',
      active !== undefined ? active : 1,
      categoryId
    ).run();

    // Get the updated category
    const category = await c.env.DB.prepare(
      "SELECT * FROM categories WHERE id = ?"
    ).bind(categoryId).first();

    return c.json<APIResponse<any>>({
      success: true,
      data: category,
      message: "Category updated successfully"
    });

  } catch (error) {
    console.error("Admin category update error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to update category" 
    }, 500);
  }
});

// DELETE /api/admin/categories/:id - Delete category (only if no posts use it)
adminRoutes.delete("/categories/:id", async (c) => {
  try {
    const categoryId = c.req.param("id");
    
    // Check if category has posts
    const postCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE category_id = ?"
    ).bind(categoryId).first();

    if (postCount && postCount.count > 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: `Cannot delete category - it has ${postCount.count} posts. Move posts to another category first.` 
      }, 400);
    }

    await c.env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(categoryId).run();

    return c.json<APIResponse>({
      success: true,
      message: "Category deleted successfully"
    });

  } catch (error) {
    console.error("Admin category deletion error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to delete category" 
    }, 500);
  }
});

// ===== TAG MANAGEMENT =====

// GET /api/admin/tags - Get all tags
adminRoutes.get("/tags", async (c) => {
  try {
    const tags = await c.env.DB.prepare(`
      SELECT * FROM tags 
      ORDER BY post_count DESC, name
    `).all();

    return c.json<APIResponse<any[]>>({
      success: true,
      data: tags.results || []
    });

  } catch (error) {
    console.error("Admin tags fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch tags" 
    }, 500);
  }
});

// POST /api/admin/tags - Create new tag
adminRoutes.post("/tags", async (c) => {
  try {
    const { name, description, color } = await c.req.json();
    
    if (!name) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Tag name is required" 
      }, 400);
    }

    // Create URL-safe slug
    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const result = await c.env.DB.prepare(`
      INSERT INTO tags (name, slug, description, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      name,
      slug,
      description || null,
      color || '#10b981'
    ).run();

    const tagId = result.meta.last_row_id;
    
    // Get the created tag
    const tag = await c.env.DB.prepare(
      "SELECT * FROM tags WHERE id = ?"
    ).bind(tagId).first();

    return c.json<APIResponse<any>>({
      success: true,
      data: tag,
      message: "Tag created successfully"
    });

  } catch (error) {
    console.error("Admin tag creation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to create tag" 
    }, 500);
  }
});

// PUT /api/admin/tags/:id - Update tag
adminRoutes.put("/tags/:id", async (c) => {
  try {
    const tagId = c.req.param("id");
    const { name, description, color, active } = await c.req.json();
    
    if (!name) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Tag name is required" 
      }, 400);
    }

    // Create URL-safe slug
    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    await c.env.DB.prepare(`
      UPDATE tags 
      SET name = ?, slug = ?, description = ?, color = ?, active = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      slug,
      description,
      color || '#10b981',
      active !== undefined ? active : 1,
      tagId
    ).run();

    // Get the updated tag
    const tag = await c.env.DB.prepare(
      "SELECT * FROM tags WHERE id = ?"
    ).bind(tagId).first();

    return c.json<APIResponse<any>>({
      success: true,
      data: tag,
      message: "Tag updated successfully"
    });

  } catch (error) {
    console.error("Admin tag update error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to update tag" 
    }, 500);
  }
});

// DELETE /api/admin/tags/:id - Delete tag
adminRoutes.delete("/tags/:id", async (c) => {
  try {
    const tagId = c.req.param("id");
    
    // Delete tag relationships first
    await c.env.DB.prepare("DELETE FROM post_tags WHERE tag_id = ?").bind(tagId).run();
    
    // Delete the tag
    await c.env.DB.prepare("DELETE FROM tags WHERE id = ?").bind(tagId).run();

    return c.json<APIResponse>({
      success: true,
      message: "Tag deleted successfully"
    });

  } catch (error) {
    console.error("Admin tag deletion error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to delete tag" 
    }, 500);
  }
});