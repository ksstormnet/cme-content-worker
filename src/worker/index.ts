import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/cloudflare-workers";
import { Env } from "../types/database";

// Import route handlers
import { authRoutes } from "./routes/auth-simple";
import { adminRoutes } from "./routes/admin"; 
import { createRoutes } from "./routes/create";

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["https://blog.cruisemadeeasy.com", "https://cme-content-worker.ksstorm.workers.dev", "http://localhost:5174"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Serve static assets for React app  
app.use("/*", serveStatic());

// API Routes
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/create", createRoutes);

// Health check
app.get("/api/health", (c) => {
  return c.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT 
  });
});

// Fallback for React SPA routing
app.get("*", serveStatic());

export default app;
