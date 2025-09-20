import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/cloudflare-workers";
import { Env } from "../types/database";
import { parsePostUrl } from "../utils/url";

// Import route handlers
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin"; 
import { createRoutes } from "./routes/create";
import { calendarRoutes } from "./routes/calendar";
import { contentAdvancedRoutes } from "./routes/content-advanced";
import { importRoutes } from "./routes/import";
import { media } from "./routes/media";

// URL pattern for blog posts (should match settings)
const BLOG_URL_PATTERN = "/%category%/";

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["https://blog.cruisemadeeasy.com", "https://cme-content-worker.ksstorm.workers.dev", "http://localhost:5174"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// API Routes - MUST come before serveStatic
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/create", createRoutes);
app.route("/api/calendar", calendarRoutes);
app.route("/api/content-advanced", contentAdvancedRoutes);
app.route("/api/import", importRoutes);
app.route("/api/media", media);


// Health check - MUST come before serveStatic
app.get("/api/health", (c) => {
  return c.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT 
  });
});

// Simple test endpoint - MUST come before serveStatic
app.post("/api/test", async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, received: body });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Category/post routing - handle URLs like /cruise-tips/post-slug
app.get("/:category/:slug", async (c) => {
  try {
    const category = c.req.param("category");
    const slug = c.req.param("slug");
    
    // Find post by category and slug
    const post = await c.env.DB.prepare(`
      SELECT p.*, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.category = ? AND p.slug = ? AND p.status = 'published'
      LIMIT 1
    `).bind(category, slug).first();
    
    if (!post) {
      return c.json({ 
        success: false, 
        error: "Post not found" 
      }, 404);
    }
    
    // Get content blocks
    const blocks = await c.env.DB.prepare(
      "SELECT * FROM content_blocks WHERE post_id = ? ORDER BY block_order"
    ).bind(post.id).all();
    
    return c.json({
      success: true,
      data: {
        ...post,
        content_blocks: blocks.results || [],
        keywords: post.keywords ? JSON.parse(post.keywords) : [],
        tags: post.tags ? JSON.parse(post.tags) : []
      }
    });
    
  } catch (error) {
    console.error("Category post fetch error:", error);
    return c.json({ 
      success: false, 
      error: "Failed to fetch post" 
    }, 500);
  }
});

// Category archive routing - handle URLs like /cruise-tips/
app.get("/:category", async (c) => {
  try {
    const category = c.req.param("category");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const offset = (page - 1) * limit;
    
    // Get posts in category
    const posts = await c.env.DB.prepare(`
      SELECT p.*, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.category = ? AND p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(category, limit, offset).all();
    
    // Get total count for pagination
    const totalResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM posts WHERE category = ? AND status = 'published'"
    ).bind(category).first();
    
    return c.json({
      success: true,
      data: {
        posts: posts.results || [],
        category: category,
        pagination: {
          page,
          limit,
          total: totalResult?.total || 0,
          pages: Math.ceil((totalResult?.total || 0) / limit)
        }
      }
    });
    
  } catch (error) {
    console.error("Category archive fetch error:", error);
    return c.json({ 
      success: false, 
      error: "Failed to fetch category posts" 
    }, 500);
  }
});

// Serve static assets for React app - ONLY in production
// In development, Vite dev server handles frontend, Worker handles API only
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic());
} else {
  // In development, return 404 for non-API routes to prevent serving stale static files
  app.get("/*", (c) => {
    return c.text("Development mode: Frontend served by Vite on port 5174", 404);
  });
}

export default app;
