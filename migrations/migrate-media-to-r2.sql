-- Migration: Convert existing media_files to new R2 images structure
-- This will preserve all existing media while moving to the new system

INSERT INTO images (
  id,
  filename, 
  original_filename,
  r2_key,
  mime_type,
  file_size,
  width,
  height,
  alt_text,
  title,
  description,
  tags,
  category_id,
  upload_user_id,
  variants_json,
  created_at
)
SELECT 
  -- Generate R2-style ID from old integer ID
  'migrated-' || LOWER(HEX(RANDOMBLOB(8))),
  
  -- Use existing filename
  filename,
  original_filename,
  
  -- Convert file_path to R2 key format
  -- old: 2025/09/filename.jpg -> new: blog-images/2025/09/filename.jpg
  CASE 
    WHEN file_path LIKE '%/%' THEN 'blog-images/' || file_path
    ELSE 'blog-images/migrated/' || filename
  END,
  
  mime_type,
  file_size,
  width,
  height,
  alt_text,
  
  -- Preserve all metadata
  title,
  description, 
  tags,
  category_id,
  uploaded_by,
  
  -- Generate variants JSON using existing CDN URLs
  json_object(
    'original', file_url,
    'thumbnail', file_url || '/cdn-cgi/image/width=150,height=150,fit=cover,quality=85',
    'social', file_url || '/cdn-cgi/image/width=1024,height=768,fit=cover,quality=85',
    'responsive', json_object(
      'small', file_url || '/cdn-cgi/image/width=320,quality=85',
      'medium', file_url || '/cdn-cgi/image/width=768,quality=85',
      'large', file_url || '/cdn-cgi/image/width=1200,quality=85'
    ),
    'webp', json_object(
      'original', file_url || '/cdn-cgi/image/format=webp,quality=85',
      'thumbnail', file_url || '/cdn-cgi/image/width=150,height=150,format=webp,fit=cover,quality=85',
      'social', file_url || '/cdn-cgi/image/width=1024,height=768,format=webp,fit=cover,quality=85'
    ),
    'alt_text', COALESCE(alt_text, '')
  ),
  
  -- Use upload_date as created_at
  COALESCE(upload_date, created_at, CURRENT_TIMESTAMP)

FROM media_files 
WHERE mime_type LIKE 'image/%'
  -- Only migrate images, skip other file types
  AND id NOT IN (
    -- Avoid duplicates if migration is run multiple times
    SELECT CAST(SUBSTR(id, 10) AS INTEGER) 
    FROM images 
    WHERE id LIKE 'migrated-%'
  );

-- Update posts table to reference migrated images
-- Convert featured_image_url to featured_image_id where possible
UPDATE posts 
SET featured_image_id = (
  SELECT i.id 
  FROM images i, media_files mf
  WHERE posts.featured_image_url = mf.file_url
    AND i.r2_key LIKE '%' || mf.filename
    AND i.id LIKE 'migrated-%'
  LIMIT 1
)
WHERE featured_image_url IS NOT NULL 
  AND featured_image_id IS NULL;

-- Statistics: Show migration results
SELECT 
  'Migration Complete' as status,
  (SELECT COUNT(*) FROM media_files WHERE mime_type LIKE 'image/%') as original_images,
  (SELECT COUNT(*) FROM images WHERE id LIKE 'migrated-%') as migrated_images,
  (SELECT COUNT(*) FROM posts WHERE featured_image_id IS NOT NULL) as posts_with_images;