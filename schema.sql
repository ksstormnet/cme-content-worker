-- CME Content Worker D1 Database Schema
-- Cloudflare D1 SQLite database for content management

-- Users table for authentication with production-grade security
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_first TEXT NOT NULL,
  user_last TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash with salt
  role TEXT NOT NULL DEFAULT 'editor', -- admin, editor, viewer
  
  -- MFA Support
  mfa_enabled BOOLEAN DEFAULT 0,
  mfa_secret TEXT, -- TOTP secret for authenticator apps
  mfa_backup_codes TEXT, -- JSON array of backup codes
  mfa_verified BOOLEAN DEFAULT 0,
  
  created_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  updated_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  last_login DATETIME,
  active BOOLEAN DEFAULT 1
);

-- Posts table for blog content
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER UNIQUE NOT NULL, -- Numeric ID for UTM parameters and external systems
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON string with structured content blocks
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published, trashed, deleted
  post_type TEXT NOT NULL DEFAULT 'monday', -- monday, wednesday, friday, saturday, newsletter
  persona TEXT, -- easy_breezy, thrill_seeker, luxe_seafarer
  author_id INTEGER,
  featured_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT, -- JSON array of SEO keywords
  category TEXT NOT NULL DEFAULT 'general', -- Single category for URL routing
  tags TEXT, -- JSON array of tags for filtering and organization
  
  -- Social media excerpt fields for GoHighLevel integration
  social_facebook_1 TEXT, -- Primary Facebook post
  social_facebook_2 TEXT, -- Alternative Facebook post
  social_facebook_3 TEXT, -- Third Facebook option
  social_linkedin TEXT, -- LinkedIn post excerpt
  social_instagram TEXT, -- Instagram post excerpt
  social_twitter TEXT, -- Twitter/X post excerpt
  social_pinterest TEXT, -- Pinterest post excerpt
  
  scheduled_date DATETIME,
  published_date DATETIME,
  trashed_at DATETIME,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  updated_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Content blocks table for structured content components
CREATE TABLE content_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  block_type TEXT NOT NULL, -- heading, paragraph, image, accent_tip, quote, etc.
  block_order INTEGER NOT NULL,
  content TEXT NOT NULL, -- JSON with block-specific data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Settings table for configuration
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI generation history for tracking and learning
CREATE TABLE ai_generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  model_used TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INTEGER,
  cost_cents INTEGER, -- cost in cents
  generation_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- CSS versions for change detection
CREATE TABLE css_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_url TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  content TEXT, -- actual CSS content
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT 1
);

-- Weekly content plans (from your existing system)
CREATE TABLE content_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start_date DATE NOT NULL,
  week_year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  main_themes TEXT NOT NULL, -- JSON array
  secondary_themes TEXT NOT NULL, -- JSON array
  tertiary_themes TEXT NOT NULL, -- JSON array
  seasonal_hooks TEXT, -- JSON array
  milestone_intersections TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_post_id ON posts(post_id);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_date);
CREATE INDEX idx_posts_post_type ON posts(post_type);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created ON posts(created_at);
CREATE INDEX idx_posts_trashed ON posts(trashed_at);
CREATE INDEX idx_posts_deleted ON posts(deleted_at);
CREATE INDEX idx_content_blocks_post_order ON content_blocks(post_id, block_order);
CREATE INDEX idx_ai_generations_post ON ai_generations(post_id);
CREATE INDEX idx_css_versions_active ON css_versions(active);
CREATE INDEX idx_social_media_images_post ON social_media_images(post_id);
CREATE INDEX idx_social_media_images_platform ON social_media_images(platform);
CREATE INDEX idx_images_category ON images(category);
CREATE INDEX idx_images_image_type ON images(image_type);
CREATE INDEX idx_content_calendar_year_week ON content_calendar(year_week);

-- Initial settings data
INSERT INTO settings (key, value, description) VALUES 
  ('blog_url_pattern', '/%category%/', 'URL pattern for blog posts routing (use %category% for dynamic category)'),
  ('site_css_urls', '["https://cruisemadeeasy.com/wp-content/themes/theme/style.css"]', 'External CSS URLs to monitor for styling synchronization'),
  ('css_sync_enabled', 'true', 'Enable automatic CSS change detection from external sites'),
  ('ai_default_model', 'gpt-3.5-turbo', 'Default AI model for content generation'),
  ('ai_fallback_model', 'llama3.1:8b', 'Fallback model for cost optimization'),
  ('posts_per_page', '20', 'Posts shown per page in admin'),
  ('auto_publish', 'true', 'Automatically publish scheduled posts at their scheduled time'),
  ('r2_bucket_name', 'cruisemadeeasy-images', 'R2 bucket name for media storage'),
  ('r2_public_url', 'https://cdn.cruisemadeeasy.com', 'Public CDN URL for serving images'),
  ('r2_internal_url', 'https://54919652c0ba9b83cb0ae04cb5ea90f3.r2.cloudflarestorage.com/cruisemadeeasy-images', 'Internal R2 URL for uploads');

-- Content calendar for weekly planning
CREATE TABLE content_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start_date DATE NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  year_week TEXT NOT NULL, -- Format: 2025-46 (year-week based on Monday date)
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, published
  themes TEXT, -- JSON array of weekly themes
  seasonal_hooks TEXT, -- JSON array of seasonal hooks
  milestone_hooks TEXT, -- JSON array of milestone hooks
  notes TEXT,
  created_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  updated_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Content briefs table for AI-generated and user-edited briefs
CREATE TABLE content_briefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_id INTEGER NOT NULL,
  post_day TEXT NOT NULL, -- monday, wednesday, friday, saturday, newsletter
  main_theme TEXT NOT NULL,
  secondary_theme TEXT NOT NULL,
  tertiary_theme TEXT NOT NULL,
  post_type TEXT NOT NULL, -- awareness, practical, aspirational, inspirational, newsletter
  persona TEXT, -- easy_breezy, thrill_seeker, luxe_seafarer, null for general
  content_brief TEXT, -- Generated content brief/outline (markdown format)
  status TEXT NOT NULL DEFAULT 'draft',
  completed_at DATETIME, -- When AI generation was completed and approved by user
  created_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  updated_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  FOREIGN KEY (calendar_id) REFERENCES content_calendar(id),
  UNIQUE(calendar_id, post_day)
);

-- Seasonal hooks and themes master data
CREATE TABLE seasonal_hooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- destination, industry, milestone
  season_start INTEGER, -- month (1-12)
  season_end INTEGER, -- month (1-12)
  peak_months TEXT, -- JSON array of peak months
  description TEXT,
  heat_index INTEGER DEFAULT 1, -- 1-5 scale
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content templates for different post types and themes
CREATE TABLE content_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  post_type TEXT NOT NULL, -- monday, wednesday, friday, saturday, newsletter
  template_content TEXT NOT NULL, -- JSON structure for content generation
  persona TEXT, -- null for general templates
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT (datetime('now', 'America/Chicago'))
);

-- Social media image relations for linking images to social excerpts
CREATE TABLE social_media_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  platform TEXT NOT NULL, -- facebook_1, facebook_2, facebook_3, linkedin, instagram, twitter, pinterest
  image_id TEXT NOT NULL,
  image_order INTEGER DEFAULT 1, -- For multiple images per platform
  created_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
  UNIQUE(post_id, platform, image_order)
);

-- Images table for R2 storage integration with Cloudflare Image Resizing
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  upload_user_id INTEGER,
  image_type TEXT NOT NULL DEFAULT 'general', -- featured, content, social, thumbnail, etc.
  category TEXT NOT NULL DEFAULT 'uncategorized', -- For tree display in media library
  created_at DATETIME DEFAULT (datetime('now', 'America/Chicago')),
  FOREIGN KEY (upload_user_id) REFERENCES users(id)
);

-- Post ID sequence will start at 1000 for UTM-friendly numeric IDs
-- Featured image relation handled through featured_image_url field
-- Social media images handled through social_media_images table
-- Cloudflare Image Resizing handles all size variants on-demand

-- Additional indexes
CREATE INDEX idx_images_filename ON images(filename);
CREATE INDEX idx_images_r2_key ON images(r2_key);
CREATE INDEX idx_images_created ON images(created_at);
-- CREATE INDEX idx_posts_featured_image ON posts(featured_image_id);

-- Auto-increment sequence for numeric post_id (starts at 1000 for UTM friendliness)
INSERT INTO posts (post_id, slug, title, content, author_id) VALUES 
  (999, '__dummy_post__', 'Dummy Post for ID Sequence', '[]', 1);
DELETE FROM posts WHERE slug = '__dummy_post__';

-- Default admin user (password should be changed immediately)
-- Password: 'admin123' - will be bcrypt hashed in production
INSERT INTO users (user_first, user_last, username, email, password_hash, role) VALUES 
  ('Admin', 'User', 'admin', 'admin@cruisemadeeasy.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin');