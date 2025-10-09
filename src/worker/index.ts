import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/cloudflare-workers";
import { Env } from "../types/database";
import { parsePostUrl } from "../utils/url";
import { getAssetManifest } from "../utils/asset-resolver";

// Import route handlers
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin"; 
import { createRoutes } from "./routes/create";
import { calendarRoutes } from "./routes/calendar";
import { contentAdvancedRoutes } from "./routes/content-advanced";
import { importRoutes } from "./routes/import";
import { media } from "./routes/media";
// Context Window 4: Template rendering system
import templateRenderRoutes from "./routes/template-render";
// Context Window 5: SEO validation system
import seoValidationRoutes from "./routes/seo-validation";
// Context Window 5: Performance monitoring system
import performanceRoutes from "./routes/performance";
// Context Window 5: Deployment readiness system
import deploymentRoutes from "./routes/deployment";
import { renderContentBlocks } from "../utils/block-renderer";

// URL pattern for blog posts (should match settings)
const BLOG_URL_PATTERN = "/%category%/";

const app = new Hono<{ Bindings: Env }>();

// Initialize asset manifest on startup
getAssetManifest().catch(error => {
  console.error('⚠️ Failed to initialize asset manifest on startup:', error);
});

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["https://blog.cruisemadeeasy.com", "https://tips.cruisemadeeasy.com", "https://cme-content-worker.ksstorm.workers.dev", "http://localhost:5174"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Public API Routes removed in Context Window 1 cleanup
// app.route("/api", publicApiRoutes);

// Protected API Routes - MUST come before serveStatic and template routes
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/create", createRoutes);
app.route("/api/calendar", calendarRoutes);
app.route("/api/content-advanced", contentAdvancedRoutes);
app.route("/api/import", importRoutes);
app.route("/api/media", media);
app.route("/api/seo", seoValidationRoutes);
app.route("/api/performance", performanceRoutes);
app.route("/api/deployment", deploymentRoutes);


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

// Public API endpoints for React BlogContent component
app.get("/api/posts", async (c) => {
  try {
    const status = c.req.query("status") || "published";
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    
    // Query with proper category JOIN using category_id FK
    const query = `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.published_date, p.featured_image_url,
        c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.published_date DESC
      LIMIT ? OFFSET ?
    `;

    const result = await c.env.DB.prepare(query).bind(limit, offset).all();

    // Transform data to match expected format
    const posts = result.results?.map((post: any) => ({
      id: post.id,
      title: post.title || 'Untitled',
      slug: post.slug || 'untitled',
      excerpt: post.excerpt || '',
      category: post.category_slug || 'general',
      featured_image_url: post.featured_image_url || 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
      published_date: post.published_date || new Date().toISOString(),
      author_name: 'Cruise Made EASY',
      meta_description: post.excerpt || ''
    })) || [];
    
    return c.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('API posts error:', error);
    return c.json({ success: false, error: 'Failed to fetch posts' }, 500);
  }
});

app.get("/api/categories", async (c) => {
  try {
    // Return some basic categories for now
    const categories = [
      { slug: 'cruise-planning', name: 'Cruise Planning', post_count: 10, priority: 1 },
      { slug: 'ship-reviews', name: 'Ship Reviews', post_count: 8, priority: 2 },
      { slug: 'destinations', name: 'Destinations', post_count: 15, priority: 3 },
      { slug: 'tips-tricks', name: 'Tips & Tricks', post_count: 12, priority: 4 }
    ];
    
    return c.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('API categories error:', error);
    return c.json({ success: false, error: 'Failed to fetch categories' }, 500);
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
// Favicon requests - serve from built React app in both environments
app.get("/favicon.ico", (c) => {
  return serveStatic({ root: "./dist/client", path: "favicon.ico" })(c);
});

app.get("/favicon.svg", (c) => {
  return serveStatic({ root: "./dist/client", path: "favicon.svg" })(c);
});

// Proxy CDN assets with CORS headers and cache-busting
app.get("/assets/index.js", async (c) => {
  try {
    // Use version parameter for cache control
    const version = c.req.query('v') || 'default';

    // Add cache-busting to CDN fetch to ensure fresh content
    const response = await fetch(`https://cdn.cruisemadeeasy.com/built-js/latest/index.js?cb=${version}`, {
      cf: { cacheTtl: 0 } // Bypass Cloudflare cache
    });
    const content = await response.text();

    return new Response(content, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': version === 'default' ? 'public, max-age=3600' : 'public, max-age=31536000', // 1 year for versioned
        'ETag': `"${version}"`
      }
    });
  } catch (error) {
    console.error('Error proxying JS:', error);
    return new Response('Failed to load JS', { status: 500 });
  }
});

app.get("/assets/index.css", async (c) => {
  try {
    // Use version parameter for cache control
    const version = c.req.query('v') || 'default';

    // Add cache-busting to CDN fetch to ensure fresh content
    const response = await fetch(`https://cdn.cruisemadeeasy.com/built-js/latest/index.css?cb=${version}`, {
      cf: { cacheTtl: 0 } // Bypass Cloudflare cache
    });
    const content = await response.text();

    return new Response(content, {
      headers: {
        'Content-Type': 'text/css',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': version === 'default' ? 'public, max-age=3600' : 'public, max-age=31536000',
        'ETag': `"${version}"`
      }
    });
  } catch (error) {
    console.error('Error proxying CSS:', error);
    return new Response('Failed to load CSS', { status: 500 });
  }
});

// Admin HTML template - serve React app with cache-busting version parameter
const ASSET_VERSION = "20251009-131700"; // Update this on each deploy to bust cache
const adminHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cruise Made EASY Blog</title>
    <script type="module" crossorigin src="/assets/index.js?v=${ASSET_VERSION}"></script>
    <link rel="stylesheet" crossorigin href="/assets/index.css?v=${ASSET_VERSION}">
  </head>

  <body>
    <div id="root"></div>
  </body>
</html>`;

// Admin login page - serve React app in both dev and production (MUST come before wildcard template routes)
app.get("/blogin", (c) => {
  return new Response(adminHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
});

// Admin interface routes - serve React app in both dev and production (MUST come before wildcard template routes)
app.get("/admin/*", (c) => {
  return new Response(adminHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
});

// Context Window 4: Template rendering system - MUST come after specific routes (API, assets, admin) - wildcards LAST
console.log('🎨 Initializing template rendering system');
app.route("/", templateRenderRoutes);

export default {
  fetch: app.fetch
};