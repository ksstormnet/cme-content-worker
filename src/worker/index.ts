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
import { cssSyncRoutes } from "./routes/css-sync";
import { templateRoutes } from "./routes/template";
import { publicApiRoutes } from "./routes/public-api";
import wordpressCssRoutes from "./routes/wordpress-css";
import { htmlTemplateGenerator } from "../utils/html-template";
import { renderContentBlocks } from "../utils/block-renderer";
import { getCSSMapping } from "../utils/css-resolver";
import { realStaticTemplate } from "../utils/static-template-real";

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

// CSS Sync Routes - MUST come before public API routes to avoid /css/:layout conflict
app.route("/api/css", cssSyncRoutes);

// Public API Routes (no auth required)
app.route("/api", publicApiRoutes);

// Protected API Routes - MUST come before serveStatic
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/create", createRoutes);
app.route("/api/calendar", calendarRoutes);
app.route("/api/content-advanced", contentAdvancedRoutes);
app.route("/api/import", importRoutes);
app.route("/api/media", media);
app.route("/api/template", templateRoutes);
app.route("/api/wordpress-css", wordpressCssRoutes);


// Health check - MUST come before serveStatic
app.get("/api/health", (c) => {
  return c.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    version: "1.0.1"
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
// Homepage route - serve real static template (production only)
app.get("/", async (c) => {
  // In development, let Vite handle this route
  if (c.env.ENVIRONMENT === "development") {
    return c.redirect("http://localhost:5174/");
  }

  try {
    // Fetch published posts for homepage
    const posts = await c.env.DB.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, c.slug as category, p.featured_image_url,
             p.published_date, p.meta_description, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.published_date DESC
      LIMIT 20
    `).all();

    console.log('Homepage posts query result:', posts);
    console.log('Posts results array length:', (posts.results || []).length);

    // Get categories with post counts for pills
    const categoriesWithCounts = await c.env.DB.prepare(`
      SELECT c.slug, c.name, COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
      GROUP BY c.id, c.slug, c.name
      HAVING COUNT(p.id) > 0
      ORDER BY c.name
    `).all();

    console.log('Categories with post counts:', categoriesWithCounts.results?.length || 0);

    // Get CSS URLs from the CSS sync system
    const cssMapping = await getCSSMapping('homepage', c.env);
    const cssUrls = cssMapping.css_files
      .map(file => file.cdn_url || file.source_url)
      .filter(Boolean) as string[];
    
    console.log('CSS URLs for homepage:', cssUrls.length);

    // Render complete page with real static template
    const html = realStaticTemplate.renderPage(
      posts.results || [], 
      cssUrls, 
      categoriesWithCounts.results || [],
      "Cruise Smarter with Norwegian: Tips, Tricks &#038; Planning Guides",
      undefined  // No active category for homepage
    );
    console.log('Homepage HTML length:', html.length);

    // Add cache-busting headers
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');

    return c.html(html);

  } catch (error) {
    console.error("Homepage error:", error);
    return c.html(`
      <h1>Homepage Error</h1>
      <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
    `, 500);
  }
});

// Category route - serve posts for specific category (production only)
app.get("/category/:categorySlug/", async (c) => {
  // In development, let Vite handle this route
  if (c.env.ENVIRONMENT === "development") {
    return c.redirect("http://localhost:5174/");
  }

  try {
    const categorySlug = c.req.param("categorySlug");
    
    // Get category info
    const category = await c.env.DB.prepare(`
      SELECT id, name, slug FROM categories WHERE slug = ?
    `).bind(categorySlug).first() as { id: number; name: string; slug: string } | null;

    if (!category) {
      return c.html(`<h1>Category Not Found</h1><p>The category "${categorySlug}" does not exist.</p>`, 404);
    }

    // Fetch published posts for this category
    const posts = await c.env.DB.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, c.slug as category, p.featured_image_url,
             p.published_date, p.meta_description, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published' AND c.slug = ?
      ORDER BY p.published_date DESC
      LIMIT 20
    `).bind(categorySlug).all();

    console.log(`Category ${categorySlug} posts:`, (posts.results || []).length);

    // Get categories with post counts for pills
    const categoriesWithCounts = await c.env.DB.prepare(`
      SELECT c.slug, c.name, COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
      GROUP BY c.id, c.slug, c.name
      HAVING COUNT(p.id) > 0
      ORDER BY c.name
    `).all();

    // Get CSS URLs from the CSS sync system
    const cssMapping = await getCSSMapping('category', c.env);
    const cssUrls = cssMapping.css_files
      .map(file => file.cdn_url || file.source_url)
      .filter(Boolean) as string[];
    
    // Generate hero text with category name
    const categoryDisplayName = category.name.toUpperCase();
    const heroText = `CRUISE MADE EASY: ${categoryDisplayName}`;

    // Render complete page with real static template
    const html = realStaticTemplate.renderPage(
      posts.results || [], 
      cssUrls, 
      categoriesWithCounts.results || [],
      heroText,
      categorySlug  // Pass current category slug for active styling
    );
    console.log(`Category ${categorySlug} HTML length:`, html.length);

    // Add cache-busting headers
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');

    return c.html(html);

  } catch (error) {
    console.error("Category error:", error);
    return c.html(`
      <h1>Category Error</h1>
      <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
    `, 500);
  }
});

// Development HTML shell template
const devHtmlShell = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/x-icon" href="http://localhost:5174/favicon.ico" />
  <link rel="icon" type="image/svg+xml" href="http://localhost:5174/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cruise Made EASY Blog</title>
  <script type="module" src="http://localhost:5174/@vite/client"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="http://localhost:5174/src/react-app/main.tsx"></script>
</body>
</html>`;

// Admin interface routing - handle both development and production
// Favicon requests
app.get("/favicon.ico", (c) => {
  if (c.env.ENVIRONMENT === "production") {
    return serveStatic({ path: "favicon.ico" })(c);
  } else {
    return c.redirect("http://localhost:5174/favicon.ico");
  }
});

app.get("/favicon.svg", (c) => {
  if (c.env.ENVIRONMENT === "production") {
    return serveStatic({ path: "favicon.svg" })(c);
  } else {
    return c.redirect("http://localhost:5174/favicon.svg");
  }
});

// Assets requests
app.get("/assets/*", (c) => {
  if (c.env.ENVIRONMENT === "production") {
    return serveStatic()(c);
  } else {
    // Development: redirect to Vite dev server
    const assetPath = c.req.path.replace('/assets/', '');
    return c.redirect(`http://localhost:5174/assets/${assetPath}`);
  }
});

// Admin login page
app.get("/blogin", (c) => {
  if (c.env.ENVIRONMENT === "production") {
    return serveStatic()(c);
  } else {
    // Development: redirect to Vite dev server root - let React Router handle routing
    return c.redirect("http://localhost:5174/");
  }
});

// Admin interface routes
app.get("/admin/*", (c) => {
  if (c.env.ENVIRONMENT === "production") {
    return serveStatic({ path: "index.html" })(c);
  } else {
    // Development: redirect to Vite dev server root - let React Router handle routing
    return c.redirect("http://localhost:5174/");
  }
});

// Category/post routing - handle URLs like /cruise-tips/post-slug (production only)
app.get("/:category/:slug", async (c) => {
  // In development, let Vite handle this route
  if (c.env.ENVIRONMENT === "development") {
    return c.redirect("http://localhost:5174/");
  }

  try {
    const category = c.req.param("category");
    const slug = c.req.param("slug");
    
    // Find post by category and slug
    const post = await c.env.DB.prepare(`
      SELECT p.*, u.name as author_name, c.slug as category
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.slug = ? AND p.slug = ? AND p.status = 'published'
      LIMIT 1
    `).bind(category, slug).first();
    
    if (!post) {
      // Return 404 HTML page
      const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Post Not Found - Cruise Made Easy</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>Post Not Found</h1>
  <p>The cruise guide you're looking for could not be found.</p>
  <a href="/">← Back to Homepage</a>
</body>
</html>`;
      return c.html(notFoundHtml, 404);
    }
    
    // Get content blocks
    const blocks = await c.env.DB.prepare(
      "SELECT * FROM content_blocks WHERE post_id = ? ORDER BY block_order"
    ).bind(post.id).all();

    // Render content blocks to HTML
    const contentHtml = renderContentBlocks(blocks.results || []);
    
    // Get CSS URL for post layout
    const cssUrl = await getCSSForLayout('post', c.env);

    // Generate complete HTML document
    const html = htmlTemplateGenerator.generatePostPage(
      post,
      blocks.results || [],
      cssUrl,
      {
        content_html: `<article class="post-content" itemscope itemtype="http://schema.org/BlogPosting">
          <header class="post-header">
            <nav aria-label="Breadcrumb">
              <ol class="breadcrumb">
                <li><a href="/">Home</a></li>
                <li><a href="/${post.category}/">${post.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</a></li>
                <li aria-current="page">${post.title}</li>
              </ol>
            </nav>
            <h1 itemprop="headline">${post.title}</h1>
            <div class="post-meta">
              <time datetime="${post.published_date || post.created_at}" itemprop="datePublished">
                ${new Date(post.published_date || post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              ${post.author_name ? `<span class="post-author" itemprop="author" itemscope itemtype="http://schema.org/Person">
                By <span itemprop="name">${post.author_name}</span>
              </span>` : ''}
            </div>
          </header>
          <main id="main-content" role="main" class="post-body" itemprop="articleBody">
            ${contentHtml}
          </main>
        </article>`
      }
    );

    return c.html(html);
    
  } catch (error) {
    console.error("Category post fetch error:", error);
    return c.json({ 
      success: false, 
      error: "Failed to fetch post" 
    }, 500);
  }
});

// Category archive routing - handle URLs like /cruise-tips/ (production only)
app.get("/:category", async (c) => {
  // In development, let Vite handle this route
  if (c.env.ENVIRONMENT === "development") {
    return c.redirect("http://localhost:5174/");
  }

  try {
    const category = c.req.param("category");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const offset = (page - 1) * limit;
    
    // Get posts in category with required fields for post cards
    const posts = await c.env.DB.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, c.slug as category, p.featured_image_url,
             p.published_date, p.meta_description, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.slug = ? AND p.status = 'published'
      ORDER BY p.published_date DESC
      LIMIT ? OFFSET ?
    `).bind(category, limit, offset).all();
    
    // If no posts found, show category not found page
    if (!posts.results || posts.results.length === 0) {
      const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Category Not Found - Cruise Made Easy</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>Category Not Found</h1>
  <p>The cruise category you're looking for could not be found or has no published posts.</p>
  <a href="/">← Back to Homepage</a>
</body>
</html>`;
      return c.html(notFoundHtml, 404);
    }
    
    // Get CSS URL for category layout (uses same CSS as homepage)
    const cssUrl = await getCSSForLayout('category', c.env);

    // Generate complete HTML document
    const html = htmlTemplateGenerator.generateCategoryPage(
      category,
      posts.results || [],
      cssUrl,
      {
        og_image: posts.results?.[0]?.featured_image_url
      }
    );

    return c.html(html);
    
  } catch (error) {
    console.error("Category archive fetch error:", error);
    return c.json({ 
      success: false, 
      error: "Failed to fetch category posts" 
    }, 500);
  }
});

// Add cron handler for CSS sync
export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    // Handle CSS sync cron job
    console.log('Scheduled CSS sync triggered at:', new Date().toISOString());
    
    const url = `https://${env.WORKER_URL || 'cme-content-worker.ksstorm.workers.dev'}/api/css/cron`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'cf-cron': '1' // Indicate this is a cron request
        }
      });
      
      console.log('CSS sync cron response:', response.status);
      
    } catch (error) {
      console.error('CSS sync cron error:', error);
    }
  }
};