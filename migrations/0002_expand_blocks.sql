-- Migration: Expand block system for WordPress import
-- Add GenerateBlocks configuration storage

-- Add new table for GenerateBlocks element configurations
CREATE TABLE IF NOT EXISTS generateblocks_elements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  element_id TEXT NOT NULL UNIQUE, -- gb-element-* ID
  element_type TEXT NOT NULL,       -- container, section, text, etc.
  configuration TEXT NOT NULL,     -- JSON configuration from WordPress
  styles TEXT,                     -- CSS styles for this element
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_generateblocks_element_id ON generateblocks_elements(element_id);
CREATE INDEX IF NOT EXISTS idx_generateblocks_type ON generateblocks_elements(element_type);

-- Add WordPress import metadata table
CREATE TABLE IF NOT EXISTS wp_import_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wp_post_id INTEGER NOT NULL,     -- Original WordPress post ID
  cme_post_id INTEGER NOT NULL,    -- Our post ID
  wp_category_slug TEXT,           -- Original WordPress category
  wp_tags TEXT,                    -- JSON array of WordPress tags
  wp_featured_media_id INTEGER,    -- WordPress media ID
  import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cme_post_id) REFERENCES posts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wp_import_wp_post_id ON wp_import_metadata(wp_post_id);
CREATE INDEX IF NOT EXISTS idx_wp_import_cme_post_id ON wp_import_metadata(cme_post_id);