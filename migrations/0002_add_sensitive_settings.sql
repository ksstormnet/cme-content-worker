-- Add is_sensitive column to settings table for API keys
ALTER TABLE settings ADD COLUMN is_sensitive BOOLEAN DEFAULT 0;

-- Create index for sensitive settings
CREATE INDEX idx_settings_sensitive ON settings(is_sensitive);