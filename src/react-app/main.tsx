import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import BlogContent from "./components/BlogContent";

// Check if we're in blog mode (template system) or admin mode
const blogMountPoint = document.getElementById("react-blog-content");
const adminMountPoint = document.getElementById("root");

if (blogMountPoint) {
  // Blog mode: mount BlogContent to #react-blog-content
  console.log("🚢 Mounting BlogContent for template system");
  
  const blogConfig = (window as any).BLOG_CONFIG || {};
  const category = blogConfig.category;

  createRoot(blogMountPoint).render(
    <StrictMode>
      <BlogContent category={category} />
    </StrictMode>
  );
  
} else if (adminMountPoint) {
  // Admin mode: mount full App to #root
  console.log("⚙️ Mounting full App for admin interface");
  
  createRoot(adminMountPoint).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
} else {
  console.error("No valid mount point found (neither #react-blog-content nor #root)");
}
