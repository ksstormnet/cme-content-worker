import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { Env, User, JWTPayload, APIResponse } from "../../types/database";

export const authRoutes = new Hono<{ Bindings: Env }>();

// Utility functions
const hashPassword = async (password: string): Promise<string> => {
  // Simple password hashing for demo - in production use proper bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
};

const createJWT = async (user: User, env: Env): Promise<string> => {
  const payload: JWTPayload = {
    user_id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  
  return await sign(payload, env.JWT_SECRET);
};

// Middleware to verify JWT
export const requireAuth = async (c: any, next: any) => {
  try {
    const token = getCookie(c, "auth_token");
    if (!token) {
      return c.json({ success: false, error: "Not authenticated" }, 401);
    }

    const payload = await verify(token, c.env.JWT_SECRET) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ success: false, error: "Token expired" }, 401);
    }

    // Get user from database
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ? AND active = 1"
    ).bind(payload.user_id).first();

    if (!user) {
      return c.json({ success: false, error: "User not found" }, 401);
    }

    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ success: false, error: "Invalid token" }, 401);
  }
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

    // Get user from database
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE email = ? AND active = 1"
    ).bind(email).first() as User;

    if (!user) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Invalid credentials" 
      }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Invalid credentials" 
      }, 401);
    }

    // Update last login
    await c.env.DB.prepare(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(user.id).run();

    // Create JWT token
    const token = await createJWT(user, c.env);

    // Set HTTP-only cookie
    setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === "production",
      sameSite: "Lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Return user info (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return c.json<APIResponse<typeof userResponse>>({ 
      success: true, 
      data: userResponse,
      message: "Login successful" 
    });

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
  deleteCookie(c, "auth_token");
  return c.json<APIResponse>({ 
    success: true, 
    message: "Logged out successfully" 
  });
});

// GET /api/auth/me
authRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user") as User;
  
  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    last_login: user.last_login,
    created_at: user.created_at,
  };

  return c.json<APIResponse<typeof userResponse>>({ 
    success: true, 
    data: userResponse 
  });
});

// POST /api/auth/change-password
authRoutes.post("/change-password", requireAuth, async (c) => {
  try {
    const { current_password, new_password } = await c.req.json();
    const user = c.get("user") as User;

    if (!current_password || !new_password) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Current password and new password required" 
      }, 400);
    }

    // Verify current password
    const isValidPassword = await verifyPassword(current_password, user.password_hash);
    if (!isValidPassword) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Invalid current password" 
      }, 401);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(new_password);

    // Update password in database
    await c.env.DB.prepare(
      "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(newPasswordHash, user.id).run();

    return c.json<APIResponse>({ 
      success: true, 
      message: "Password updated successfully" 
    });

  } catch (error) {
    console.error("Password change error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Internal server error" 
    }, 500);
  }
});