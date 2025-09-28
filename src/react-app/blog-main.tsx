import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import BlogWithFilters from "./components/BlogWithFilters";

// Blog-only entry point - NO React Router imports
const initializeBlogReact = () => {
  const blogMountPoint = document.getElementById("react-blog-content");

  if (blogMountPoint) {
    console.log("🚢 Mounting BlogContent for template system (Router-free)");
    
    const blogConfig = (window as any).BLOG_CONFIG || {};
    const category = blogConfig.category;

    try {
      createRoot(blogMountPoint).render(
        <StrictMode>
          <BlogWithFilters category={category} />
        </StrictMode>
      );
      console.log("✅ Blog React component mounted successfully (Router-free)");
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
  } else {
    console.error("Blog mount point #react-blog-content not found");
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBlogReact);
} else {
  // DOM already loaded
  initializeBlogReact();
}