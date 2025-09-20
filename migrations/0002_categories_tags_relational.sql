-- Migration: Add proper relational categories and tags tables
-- This replaces the plain text category/tags fields with proper relational design

-- Categories table - Master list of post categories
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  icon TEXT, -- emoji or icon class for UI display
  active BOOLEAN DEFAULT 1,
  post_count INTEGER DEFAULT 0, -- denormalized count for performance
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags table - Master list of content tags
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#10b981',
  active BOOLEAN DEFAULT 1,
  post_count INTEGER DEFAULT 0, -- denormalized count for performance
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add category_id foreign key to posts table
ALTER TABLE posts ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Many-to-many relationship table for post tags
CREATE TABLE post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(active);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_active ON tags(active);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- Insert default categories based on existing hardcoded ones
INSERT INTO categories (name, slug, description, color, icon) VALUES 
  ('General', 'general', 'General cruise content and information', '#6b7280', '📝'),
  ('Cruise Tips', 'cruise-tips', 'Helpful tips and advice for cruise travelers', '#3b82f6', '💡'),
  ('Destinations', 'destinations', 'Cruise destination guides and highlights', '#10b981', '🌍'),
  ('Cruise Lines', 'cruise-lines', 'Reviews and information about cruise lines', '#f59e0b', '🚢'),
  ('Planning', 'planning', 'Cruise planning and booking advice', '#8b5cf6', '📅'),
  ('Ship Reviews', 'ship-reviews', 'Detailed ship reviews and comparisons', '#ef4444', '⭐'),
  ('Port Guides', 'port-guides', 'Port of call guides and excursions', '#06b6d4', '⚓'),
  ('Dining', 'dining', 'Cruise dining options and specialty restaurants', '#f97316', '🍽️'),
  ('Entertainment', 'entertainment', 'Onboard entertainment and activities', '#ec4899', '🎭'),
  ('Excursions', 'excursions', 'Shore excursions and port activities', '#84cc16', '🏖️');

-- Insert common tags
INSERT INTO tags (name, slug, description) VALUES 
  ('First Time Cruiser', 'first-time-cruiser', 'Content for first-time cruise passengers'),
  ('Family Friendly', 'family-friendly', 'Family-oriented cruise content'),
  ('Luxury', 'luxury', 'Luxury cruise experiences'),
  ('Budget Tips', 'budget-tips', 'Money-saving cruise advice'),
  ('Alaska', 'alaska', 'Alaska cruise destinations'),
  ('Caribbean', 'caribbean', 'Caribbean cruise destinations'),
  ('Mediterranean', 'mediterranean', 'Mediterranean cruise destinations'),
  ('Norwegian Cruise Line', 'norwegian-cruise-line', 'NCL-specific content'),
  ('Shore Excursions', 'shore-excursions', 'Land-based activities at ports'),
  ('Packing Tips', 'packing-tips', 'What to pack for cruises'),
  ('Specialty Dining', 'specialty-dining', 'Premium dining experiences'),
  ('Entertainment', 'entertainment', 'Shows and activities onboard'),
  ('Spa & Wellness', 'spa-wellness', 'Relaxation and wellness activities'),
  ('Photography', 'photography', 'Cruise photography tips'),
  ('Weather', 'weather', 'Weather-related cruise information');

-- Update existing posts to use the 'General' category if they don't have category set
-- This assumes category_id 1 is 'General' from our insert above
UPDATE posts SET category_id = 1 WHERE category_id IS NULL;

-- Trigger to update category post_count when posts are added/removed
CREATE TRIGGER update_category_count_insert 
  AFTER INSERT ON posts
  WHEN NEW.category_id IS NOT NULL
BEGIN
  UPDATE categories 
  SET post_count = post_count + 1, updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.category_id;
END;

CREATE TRIGGER update_category_count_delete 
  AFTER DELETE ON posts
  WHEN OLD.category_id IS NOT NULL
BEGIN
  UPDATE categories 
  SET post_count = post_count - 1, updated_at = CURRENT_TIMESTAMP 
  WHERE id = OLD.category_id;
END;

CREATE TRIGGER update_category_count_update 
  AFTER UPDATE ON posts
  WHEN OLD.category_id != NEW.category_id
BEGIN
  -- Decrease count for old category
  UPDATE categories 
  SET post_count = post_count - 1, updated_at = CURRENT_TIMESTAMP 
  WHERE id = OLD.category_id AND OLD.category_id IS NOT NULL;
  
  -- Increase count for new category  
  UPDATE categories 
  SET post_count = post_count + 1, updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.category_id AND NEW.category_id IS NOT NULL;
END;

-- Trigger to update tag post_count when tags are added/removed
CREATE TRIGGER update_tag_count_insert 
  AFTER INSERT ON post_tags
BEGIN
  UPDATE tags 
  SET post_count = post_count + 1, updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.tag_id;
END;

CREATE TRIGGER update_tag_count_delete 
  AFTER DELETE ON post_tags
BEGIN
  UPDATE tags 
  SET post_count = post_count - 1, updated_at = CURRENT_TIMESTAMP 
  WHERE id = OLD.tag_id;
END;