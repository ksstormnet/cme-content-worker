import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import BlogWithFilters from "./components/BlogWithFilters";

// Ensure DOM is ready before mounting
const initializeReact = () => {
  // Check if we're in blog mode (template system) or admin mode
  const blogMountPoint = document.getElementById("react-blog-content");
  const adminMountPoint = document.getElementById("root");

  if (blogMountPoint) {
    // Blog mode: mount BlogContent to #react-blog-content
    console.log("🚢 Mounting BlogContent for template system");
    
    const blogConfig = (window as any).BLOG_CONFIG || {};
    const category = blogConfig.category;

    try {
      createRoot(blogMountPoint).render(
        <StrictMode>
          <BrowserRouter>
            <BlogWithFilters category={category} />
          </BrowserRouter>
        </StrictMode>
      );
      console.log("✅ Blog React component mounted successfully");
    } catch (error) {
      console.error("❌ Failed to mount blog React component:", error);
      // Fallback: show error message in the mount point
      blogMountPoint.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
          <h3>Unable to load blog content</h3>
          <p>React component initialization failed.</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    }
    
  } else if (adminMountPoint) {
    // Admin mode: mount full App to #root
    console.log("⚙️ Mounting full App for admin interface");
    
    try {
      createRoot(adminMountPoint).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      console.log("✅ Admin React app mounted successfully");
    } catch (error) {
      console.error("❌ Failed to mount admin React app:", error);
    }
    
  } else {
    console.error("No valid mount point found (neither #react-blog-content nor #root)");
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReact);
} else {
  // DOM already loaded
  initializeReact();
}
