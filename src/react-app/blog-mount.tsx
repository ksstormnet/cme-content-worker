import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import BlogWithFilters from "./components/BlogWithFilters";

// Blog-specific mounting point for template system integration  
// This mounts the BlogWithFilters component directly into #react-blog-content
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

  console.log("Mounting BlogWithFilters with config:", blogConfig);

  createRoot(mountPoint).render(
    <StrictMode>
      <Router>
        <BlogWithFilters category={category} />
      </Router>
    </StrictMode>
  );
};

// Mount immediately when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountBlogContent);
} else {
  mountBlogContent();
}