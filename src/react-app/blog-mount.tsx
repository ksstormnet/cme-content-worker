import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import BlogContent from "./components/BlogContent";

// Blog-specific mounting point for template system integration
// This mounts the BlogContent component directly into #react-blog-content
// without the full App wrapper (which is designed for admin routes)

const mountBlogContent = () => {
  const mountPoint = document.getElementById("react-blog-content");
  
  if (!mountPoint) {
    console.error("Blog mount point #react-blog-content not found");
    return;
  }

  // Get blog configuration from window object (set by template system)
  const blogConfig = (window as any).BLOG_CONFIG || {};
  const category = blogConfig.category;

  console.log("Mounting BlogContent with config:", blogConfig);

  createRoot(mountPoint).render(
    <StrictMode>
      <BlogContent category={category} />
    </StrictMode>
  );
};

// Mount immediately when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountBlogContent);
} else {
  mountBlogContent();
}