-- Fix migrated image URLs to use consistent CDN paths
-- The original migration used old file_url, but media.ts generates new format

-- Update variants_json to use the correct base URL format
UPDATE images
SET variants_json = json_object(
  'original', 'https://cdn.cruisemadeeasy.com/' || r2_key,
  'thumbnail', 'https://cdn.cruisemadeeasy.com/' || r2_key || '/cdn-cgi/image/width=150,height=150,fit=cover,quality=85',
  'social', 'https://cdn.cruisemadeeasy.com/' || r2_key || '/cdn-cgi/image/width=1024,height=768,fit=cover,quality=85',
  'responsive', json_object(
    'small', 'https://cdn.cruisemadeeasy.com/' || r2_key || '/cdn-cgi/image/width=320,quality=85',
    'medium', 'https://cdn.cruisemadeeasy.com/' || r2_key || '/cdn-cgi/image/width=768,quality=85',
    'large', 'https://cdn.cruisemadeeasy.com/' || r2_key || '/cdn-cgi/image/width=1200,quality=85'
  ),
  'webp', json_object(
    'original', 'https://cdn.cruisemadeeasy.com/' || r2_key || '/cdn-cgi/image/format=webp,quality=85',
    'thumbnail', 'https://cdn.cruisemadeeasy.com/' || r2_key || '/cdn-cgi/image/width=150,height=150,format=webp,fit=cover,quality=85',
    'social', 'https://cdn.cruisemadeeasy.com/' || r2_key || '/cdn-cgi/image/width=1024,height=768,format=webp,fit=cover,quality=85'
  ),
  'alt_text', COALESCE(alt_text, '')
)
WHERE id LIKE 'migrated-%';

-- Show results
SELECT 
  'URL Fix Complete' as status,
  COUNT(*) as updated_images
FROM images 
WHERE id LIKE 'migrated-%';