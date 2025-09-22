-- Migration: Add priority field to categories table
-- This enables priority-based category display in the blog interface
-- Priority 1-4 are "primary" categories, NULL priority categories go in "MORE" dropdown

ALTER TABLE categories ADD COLUMN priority INTEGER CHECK (priority >= 1 AND priority <= 4);

-- Set initial priorities for main categories
UPDATE categories SET priority = 1 WHERE slug = 'cruise-tips';
UPDATE categories SET priority = 2 WHERE slug = 'destinations';  
UPDATE categories SET priority = 3 WHERE slug = 'planning';
UPDATE categories SET priority = 4 WHERE slug = 'ship-reviews';

-- Create index for efficient priority-based queries
CREATE INDEX idx_categories_priority ON categories(priority);