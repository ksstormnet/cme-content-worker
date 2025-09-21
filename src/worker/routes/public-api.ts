import { Hono } from "hono";
import { Env, APIResponse } from "../../types/database";
import { getCSSMapping } from "../../utils/css-resolver";
import { renderContentBlocks } from "../../utils/block-renderer";

export const publicApiRoutes = new Hono<{ Bindings: Env }>();

// GET /api/posts - Get published posts for blog
publicApiRoutes.get("/posts", async (c) => {
  try {
    const category = c.req.query("category");
    const status = c.req.query("status") || "published";
    const limit = parseInt(c.req.query("limit") || "10");
    const offset = parseInt(c.req.query("offset") || "0");

    let query = `
      SELECT p.id, p.title, p.slug, p.excerpt, c.slug as category, p.featured_image_url,
             p.published_date, p.meta_description, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = ?
    `;
    const params = [status];

    if (category) {
      query += ` AND c.slug = ?`;
      params.push(category);
    }

    query += ` ORDER BY p.published_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const posts = await c.env.DB.prepare(query).bind(...params).all();

    return c.json<APIResponse>({
      success: true,
      data: posts.results || []
    });

  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json<APIResponse>({
      success: false,
      error: "Failed to fetch posts"
    }, 500);
  }
});

// GET /api/posts/:category/:slug - Get specific post with content blocks
publicApiRoutes.get("/posts/:category/:slug", async (c) => {
  try {
    const category = c.req.param("category");
    const slug = c.req.param("slug");

    // Get post with category and author info
    const post = await c.env.DB.prepare(`
      SELECT p.*, u.name as author_name, c.slug as category, c.name as category_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.slug = ? AND p.slug = ? AND p.status = 'published'
      LIMIT 1
    `).bind(category, slug).first();

    if (!post) {
      return c.json<APIResponse>({
        success: false,
        error: "Post not found"
      }, 404);
    }

    // Get content blocks
    const blocks = await c.env.DB.prepare(`
      SELECT * FROM content_blocks 
      WHERE post_id = ? 
      ORDER BY block_order
    `).bind(post.id).all();

    const postWithBlocks = {
      ...post,
      content_blocks: blocks.results || []
    };

    return c.json<APIResponse>({
      success: true,
      data: postWithBlocks
    });

  } catch (error) {
    console.error("Error fetching post:", error);
    return c.json<APIResponse>({
      success: false,
      error: "Failed to fetch post"
    }, 500);
  }
});

// POST /api/posts/:category/:slug/render - Render content blocks to HTML
publicApiRoutes.post("/posts/:category/:slug/render", async (c) => {
  try {
    const { blocks } = await c.req.json();

    if (!blocks || !Array.isArray(blocks)) {
      return c.json<APIResponse>({
        success: false,
        error: "Content blocks are required"
      }, 400);
    }

    const html = renderContentBlocks(blocks);

    return c.json<APIResponse>({
      success: true,
      data: { html }
    });

  } catch (error) {
    console.error("Error rendering content blocks:", error);
    return c.json<APIResponse>({
      success: false,
      error: "Failed to render content blocks"
    }, 500);
  }
});

// GET /api/categories - Get all categories with post counts
publicApiRoutes.get("/categories", async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT c.id, c.slug, c.name, c.description, COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
      GROUP BY c.id, c.slug, c.name, c.description
      ORDER BY c.name
    `).all();

    return c.json<APIResponse>({
      success: true,
      data: categories.results || []
    });

  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json<APIResponse>({
      success: false,
      error: "Failed to fetch categories"
    }, 500);
  }
});

// GET /api/categories/:slug - Get specific category info
publicApiRoutes.get("/categories/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    const category = await c.env.DB.prepare(`
      SELECT c.*, COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
      WHERE c.slug = ?
      GROUP BY c.id, c.slug, c.name, c.description
    `).bind(slug).first();

    if (!category) {
      return c.json<APIResponse>({
        success: false,
        error: "Category not found"
      }, 404);
    }

    return c.json<APIResponse>({
      success: true,
      data: category
    });

  } catch (error) {
    console.error("Error fetching category:", error);
    return c.json<APIResponse>({
      success: false,
      error: "Failed to fetch category"
    }, 500);
  }
});

// GET /api/css/:layout - Get CSS URLs for a specific layout
publicApiRoutes.get("/css/:layout", async (c) => {
  try {
    const layout = c.req.param("layout");
    
    // Valid layouts: homepage, category, post
    const validLayouts = ["homepage", "category", "post"];
    if (!validLayouts.includes(layout)) {
      return c.json<APIResponse>({
        success: false,
        error: "Invalid layout type"
      }, 400);
    }

    const cssMapping = await getCSSMapping(layout, c.env);

    return c.json<APIResponse>({
      success: true,
      ...cssMapping
    });

  } catch (error) {
    console.error("Error fetching CSS mapping:", error);
    return c.json<APIResponse>({
      success: false,
      error: "Failed to fetch CSS mapping"
    }, 500);
  }
});