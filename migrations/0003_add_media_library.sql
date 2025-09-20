-- Media Library Migration
-- Adds comprehensive media management with categories

-- Media categories table for organizing media files
CREATE TABLE media_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6', -- Hex color for UI
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES media_categories(id)
);

-- Media files table - WordPress-compatible structure
CREATE TABLE media_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  title TEXT,
  alt_text TEXT,
  caption TEXT,
  description TEXT,
  file_path TEXT NOT NULL, -- WordPress-style path: /wp-content/uploads/YYYY/MM/filename.ext
  file_url TEXT NOT NULL, -- Full CDN URL for serving
  file_type TEXT NOT NULL, -- image/jpeg, image/png, etc.
  file_size INTEGER NOT NULL, -- Size in bytes
  mime_type TEXT NOT NULL,
  width INTEGER, -- For images
  height INTEGER, -- For images
  category_id INTEGER,
  uploaded_by INTEGER NOT NULL,
  is_featured BOOLEAN DEFAULT 0,
  seo_keywords TEXT, -- JSON array of keywords for SEO
  tags TEXT, -- JSON array of tags
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES media_categories(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Media usage tracking - where media is used
CREATE TABLE media_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL,
  post_id INTEGER,
  content_block_id INTEGER,
  usage_type TEXT NOT NULL, -- featured_image, content_block, inline, etc.
  usage_context TEXT, -- Additional context about usage
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_id) REFERENCES media_files(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (content_block_id) REFERENCES content_blocks(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_media_files_category ON media_files(category_id);
CREATE INDEX idx_media_files_type ON media_files(file_type);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_upload_date ON media_files(upload_date);
CREATE INDEX idx_media_files_featured ON media_files(is_featured);
CREATE INDEX idx_media_categories_parent ON media_categories(parent_id);
CREATE INDEX idx_media_categories_slug ON media_categories(slug);
CREATE INDEX idx_media_usage_media ON media_usage(media_id);
CREATE INDEX idx_media_usage_post ON media_usage(post_id);

-- Default media categories
INSERT INTO media_categories (name, slug, description, sort_order, color) VALUES 
  ('General', 'general', 'General purpose images and media', 0, '#6B7280'),
  ('NCL Logos', 'ncl-logos', 'Norwegian Cruise Line brand logos and assets', 10, '#0066CC'),
  ('Our Logos', 'our-logos', 'Cruise Made Easy brand logos and assets', 20, '#10B981'),
  ('Ship Images', 'ship-images', 'Cruise ship photos and deck plans', 30, '#3B82F6'),
  ('Destination Photos', 'destinations', 'Port and destination photography', 40, '#F59E0B'),
  ('Cruise Lifestyle', 'lifestyle', 'Cruise experience and lifestyle images', 50, '#EF4444'),
  ('Food & Dining', 'food-dining', 'Restaurant and dining imagery', 60, '#8B5CF6'),
  ('Activities', 'activities', 'Onboard activities and entertainment', 70, '#06B6D4'),
  ('Cabins & Suites', 'cabins-suites', 'Stateroom and accommodation photos', 80, '#84CC16'),
  ('Graphics & Icons', 'graphics-icons', 'Custom graphics, icons, and illustrations', 90, '#F97316');