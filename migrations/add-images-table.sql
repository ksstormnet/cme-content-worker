-- Add images table for R2 integration
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
  variants_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (upload_user_id) REFERENCES users(id)
);

-- Add featured_image_id column to posts table
ALTER TABLE posts ADD COLUMN featured_image_id TEXT;

-- Create indexes for images table
CREATE INDEX idx_images_filename ON images(filename);
CREATE INDEX idx_images_r2_key ON images(r2_key);
CREATE INDEX idx_images_created ON images(created_at);
CREATE INDEX idx_posts_featured_image ON posts(featured_image_id);