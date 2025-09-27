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
// Context Window 4: Template rendering system
import templateRenderRoutes from "./routes/template-render";
// Context Window 5: SEO validation system
import seoValidationRoutes from "./routes/seo-validation";
// Context Window 5: Performance monitoring system
import performanceRoutes from "./routes/performance";
import { renderContentBlocks } from "../utils/block-renderer";

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

// Context Window 4: Template rendering system - MUST come after API routes but before admin routes
console.log('🎨 Initializing template rendering system');
app.route("/", templateRenderRoutes);

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

// Admin interface routes - these MUST come after template routes to avoid conflicts
app.get("/admin/*", (c) => {
  if (c.env.ENVIRONMENT === "production") {
    return serveStatic({ path: "index.html" })(c);
  } else {
    // Development: redirect to Vite dev server root - let React Router handle routing
    return c.redirect("http://localhost:5174/");
  }
});

export default {
  fetch: app.fetch
};