-- CME Content Worker D1 Database Schema
-- Cloudflare D1 SQLite database for content management

-- Users table for authentication
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor', -- admin, editor, viewer
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  last_login DATETIME,
  active BOOLEAN DEFAULT 1
);

-- Posts table for blog content
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON string with structured content blocks
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published
  post_type TEXT NOT NULL DEFAULT 'monday', -- monday, wednesday, friday, saturday, newsletter
  persona TEXT, -- easy_breezy, thrill_seeker, luxe_seafarer
  author_id INTEGER,
  featured_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT, -- JSON array of SEO keywords
  category TEXT NOT NULL DEFAULT 'general', -- Single category for URL routing
  tags TEXT, -- JSON array of tags for filtering and organization
  scheduled_date DATETIME,
  published_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
CREATE INDEX idx_posts_scheduled ON posts(scheduled_date);
CREATE INDEX idx_posts_post_type ON posts(post_type);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created ON posts(created_at);
CREATE INDEX idx_content_blocks_post_order ON content_blocks(post_id, block_order);
CREATE INDEX idx_ai_generations_post ON ai_generations(post_id);
CREATE INDEX idx_css_versions_active ON css_versions(active);

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
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, published
  themes TEXT, -- JSON array of weekly themes
  seasonal_hooks TEXT, -- JSON array of seasonal hooks
  milestone_hooks TEXT, -- JSON array of milestone hooks
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Weekly content plans (detailed plans for each week)
CREATE TABLE weekly_content_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_id INTEGER NOT NULL,
  post_day TEXT NOT NULL, -- monday, wednesday, friday, saturday, newsletter
  main_theme TEXT NOT NULL,
  secondary_theme TEXT NOT NULL,
  tertiary_theme TEXT NOT NULL,
  post_type TEXT NOT NULL, -- awareness, practical, aspirational, inspirational, newsletter
  persona TEXT, -- easy_breezy, thrill_seeker, luxe_seafarer, null for general
  content_brief TEXT, -- Generated content brief/outline
  status TEXT NOT NULL DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user (password should be changed immediately)
-- Password: 'admin123' hashed with SHA-256 + salt (matching our auth system)
INSERT INTO users (email, password_hash, name, role) VALUES 
  ('admin@cruisemadeeasy.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Admin User', 'admin');