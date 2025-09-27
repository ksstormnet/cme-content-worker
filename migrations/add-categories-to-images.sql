-- Add category support to images table to preserve existing category structure

-- Add category_id field to images table
ALTER TABLE images ADD COLUMN category_id INTEGER;

-- Add foreign key reference (SQLite doesn't enforce this but it's good documentation)
-- FOREIGN KEY (category_id) REFERENCES media_categories(id)

-- Create index for category lookups
CREATE INDEX idx_images_category ON images(category_id);

-- Also add missing fields that exist in media_files but not images
ALTER TABLE images ADD COLUMN title TEXT;
ALTER TABLE images ADD COLUMN description TEXT;
ALTER TABLE images ADD COLUMN tags TEXT;