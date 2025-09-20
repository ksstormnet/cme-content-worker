import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/cloudflare-workers";
import { Env } from "../types/database";

// Import route handlers - temporarily commented out for debugging
// import { authRoutes } from "./routes/auth-simple";
// import { adminRoutes } from "./routes/admin"; 
// import { createRoutes } from "./routes/create";

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["https://blog.cruisemadeeasy.com", "https://cme-content-worker.ksstorm.workers.dev", "http://localhost:5174"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Minimal auth endpoint for testing - MUST come before serveStatic
app.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (email === 'admin@cruisemadeeasy.com' && password === 'admin123') {
      return c.json({ 
        success: true, 
        data: { 
          id: 1, 
          email: 'admin@cruisemadeeasy.com', 
          name: 'Admin User', 
          role: 'admin' 
        } 
      });
    }
    
    return c.json({ success: false, error: "Invalid credentials" }, 401);
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get("/api/auth/me", async (c) => {
  return c.json({ success: false, error: "Not authenticated" }, 401);
});

app.post("/api/auth/change-password", async (c) => {
  try {
    const { current_password, new_password } = await c.req.json();
    
    if (!current_password || !new_password) {
      return c.json({ 
        success: false, 
        error: "Current password and new password are required" 
      }, 400);
    }

    if (new_password.length < 6) {
      return c.json({ 
        success: false, 
        error: "New password must be at least 6 characters long" 
      }, 400);
    }

    // For now, just check if current password is admin123
    if (current_password === 'admin123') {
      // In a real implementation, we'd hash the new password and store it in D1
      // For now, we'll just return success
      return c.json({ 
        success: true, 
        message: "Password changed successfully" 
      });
    }

    return c.json({ 
      success: false, 
      error: "Current password is incorrect" 
    }, 401);

  } catch (error) {
    return c.json({ 
      success: false, 
      error: "Failed to change password" 
    }, 500);
  }
});

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

// Serve static assets for React app - MUST come LAST
app.use("/*", serveStatic());

export default app;
