import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { Env, APIResponse } from "../../types/database";

export const authRoutes = new Hono<{ Bindings: Env }>();

// Simple password hash for testing - just SHA256
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};

// POST /api/auth/login
authRoutes.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Email and password required" 
      }, 400);
    }

    // For testing - hardcoded check
    if (email === 'admin@cruisemadeeasy.com' && password === 'admin123') {
      // Set a simple session cookie
      setCookie(c, "auth_session", "authenticated", {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: 24 * 60 * 60,
        path: "/",
      });

      return c.json<APIResponse>({ 
        success: true, 
        data: {
          id: 1,
          email: 'admin@cruisemadeeasy.com',
          name: 'Admin User',
          role: 'admin'
        },
        message: "Login successful" 
      });
    }

    return c.json<APIResponse>({ 
      success: false, 
      error: "Invalid credentials" 
    }, 401);

  } catch (error) {
    console.error("Login error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Internal server error" 
    }, 500);
  }
});

// POST /api/auth/logout
authRoutes.post("/logout", async (c) => {
  deleteCookie(c, "auth_session");
  return c.json<APIResponse>({ 
    success: true, 
    message: "Logged out successfully" 
  });
});

// GET /api/auth/me
authRoutes.get("/me", async (c) => {
  // Simple session check
  const session = c.req.header("cookie")?.includes("auth_session=authenticated");
  
  if (session) {
    return c.json<APIResponse>({ 
      success: true, 
      data: {
        id: 1,
        email: 'admin@cruisemadeeasy.com',
        name: 'Admin User',
        role: 'admin'
      }
    });
  }

  return c.json<APIResponse>({ 
    success: false, 
    error: "Not authenticated" 
  }, 401);
});