// Media Library API Routes
// Comprehensive media management with categories and WordPress compatibility

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './auth';
import { 
  uploadToR2, 
  deleteFromR2, 
  validateMediaFile,
  generateThumbnailUrls,
  type MediaUploadResult 
} from '../../utils/r2-media';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
};

const media = new Hono<{ Bindings: Bindings }>();

// CORS middleware
media.use('*', cors({
  origin: ['http://localhost:5173', 'https://content.cruisemadeeasy.com'],
  credentials: true,
}));

// Apply auth to all routes
media.use('*', requireAuth);

/**
 * GET /api/media - List media files with optional filtering
 */
media.get('/', async (c) => {
  try {
    const { category, search, page = '1', limit = '20', type } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        m.id,
        m.filename,
        m.original_filename,
        m.title,
        m.alt_text,
        m.caption,
        m.description,
        m.file_path,
        m.file_url,
        m.file_type,
        m.file_size,
        m.mime_type,
        m.width,
        m.height,
        m.category_id,
        m.uploaded_by,
        m.is_featured,
        m.tags,
        m.upload_date,
        mc.name as category_name,
        mc.color as category_color,
        u.name as uploaded_by_name
      FROM media_files m
      LEFT JOIN media_categories mc ON m.category_id = mc.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (category && category !== 'all' && category !== 'all_including_non_viewable') {
      query += ' AND mc.slug = ?';
      params.push(category);
    } else if (category === 'all') {
      // When showing "all" categories, exclude Non-Viewable files
      // Non-Viewable files only show when explicitly selected
      query += ' AND (mc.slug != ? OR mc.slug IS NULL)';
      params.push('non-viewable');
    }
    // If category is 'all_including_non_viewable', don't add any category filter

    if (search) {
      query += ' AND (m.title LIKE ? OR m.original_filename LIKE ? OR m.alt_text LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (type) {
      query += ' AND m.file_type LIKE ?';
      params.push(`${type}/%`);
    }

    query += ' ORDER BY m.upload_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const files = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM media_files m LEFT JOIN media_categories mc ON m.category_id = mc.id WHERE 1=1';
    const countParams: any[] = [];

    if (category && category !== 'all' && category !== 'all_including_non_viewable') {
      countQuery += ' AND mc.slug = ?';
      countParams.push(category);
    } else if (category === 'all') {
      // When showing "all" categories, exclude Non-Viewable files from count
      countQuery += ' AND (mc.slug != ? OR mc.slug IS NULL)';
      countParams.push('non-viewable');
    }
    // If category is 'all_including_non_viewable', don't add any category filter to count

    if (search) {
      countQuery += ' AND (m.title LIKE ? OR m.original_filename LIKE ? OR m.alt_text LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (type) {
      countQuery += ' AND m.file_type LIKE ?';
      countParams.push(`${type}/%`);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    const total = countResult?.total || 0;

    // Add thumbnail URLs for images
    const enrichedFiles = files.results?.map((file: any) => ({
      ...file,
      thumbnails: file.file_type.startsWith('image/') 
        ? generateThumbnailUrls(file.file_url, file.filename)
        : null,
    })) || [];

    return c.json({
      files: enrichedFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Media list error:', error);
    return c.json({ error: 'Failed to fetch media files' }, 500);
  }
});

/**
 * GET /api/media/categories - List all media categories
 */
media.get('/categories', async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT 
        mc.id,
        mc.name,
        mc.slug,
        mc.description,
        mc.color,
        mc.parent_id,
        mc.sort_order,
        COUNT(m.id) as file_count
      FROM media_categories mc
      LEFT JOIN media_files m ON mc.id = m.category_id
      GROUP BY mc.id, mc.name, mc.slug, mc.description, mc.color, mc.parent_id, mc.sort_order
      ORDER BY mc.sort_order, mc.name
    `).all();

    return c.json({ categories: categories.results || [] });
  } catch (error) {
    console.error('Categories list error:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

/**
 * POST /api/media/upload - Upload new media file
 */
media.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const altText = formData.get('alt_text') as string;
    const caption = formData.get('caption') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('category_id') as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file
    const validation = validateMediaFile(file);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    const user = c.get('user');
    const buffer = await file.arrayBuffer();

    // Upload to R2
    const uploadResult: MediaUploadResult = await uploadToR2({
      filename: file.name,
      size: file.size,
      type: file.type,
      buffer,
    }, c.env);

    // Save to database
    const mediaId = await c.env.DB.prepare(`
      INSERT INTO media_files (
        filename, original_filename, title, alt_text, caption, description,
        file_path, file_url, file_type, file_size, mime_type, width, height,
        category_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uploadResult.filename,
      uploadResult.originalFilename,
      title || uploadResult.originalFilename,
      altText || '',
      caption || '',
      description || '',
      uploadResult.filePath,
      uploadResult.fileUrl,
      file.type.split('/')[0], // image, video, audio, etc.
      uploadResult.fileSize,
      uploadResult.mimeType,
      uploadResult.width || null,
      uploadResult.height || null,
      categoryId && categoryId !== 'null' ? parseInt(categoryId) : null,
      user.id
    ).run();

    // Fetch the complete record
    const newMedia = await c.env.DB.prepare(`
      SELECT 
        m.*,
        mc.name as category_name,
        mc.color as category_color,
        u.name as uploaded_by_name
      FROM media_files m
      LEFT JOIN media_categories mc ON m.category_id = mc.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = ?
    `).bind(mediaId.meta.last_row_id).first();

    const enrichedMedia = {
      ...newMedia,
      thumbnails: newMedia?.file_type.startsWith('image/') 
        ? generateThumbnailUrls(newMedia.file_url, newMedia.filename)
        : null,
    };

    return c.json({ 
      media: enrichedMedia,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, 500);
  }
});

/**
 * PUT /api/media/:id - Update media metadata
 */
media.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const {
      title,
      alt_text,
      caption,
      description,
      category_id,
      is_featured,
      seo_keywords,
      tags
    } = await c.req.json();

    // Check if media exists
    const existingMedia = await c.env.DB.prepare(
      'SELECT id FROM media_files WHERE id = ?'
    ).bind(id).first();

    if (!existingMedia) {
      return c.json({ error: 'Media not found' }, 404);
    }

    // Update media
    await c.env.DB.prepare(`
      UPDATE media_files 
      SET 
        title = ?,
        alt_text = ?,
        caption = ?,
        description = ?,
        category_id = ?,
        is_featured = ?,
        seo_keywords = ?,
        tags = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      alt_text || '',
      caption || '',
      description || '',
      category_id || null,
      is_featured || 0,
      seo_keywords ? JSON.stringify(seo_keywords) : null,
      tags ? JSON.stringify(tags) : null,
      id
    ).run();

    // Fetch updated record
    const updatedMedia = await c.env.DB.prepare(`
      SELECT 
        m.*,
        mc.name as category_name,
        mc.color as category_color,
        u.name as uploaded_by_name
      FROM media_files m
      LEFT JOIN media_categories mc ON m.category_id = mc.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = ?
    `).bind(id).first();

    return c.json({
      media: {
        ...updatedMedia,
        thumbnails: updatedMedia?.file_type.startsWith('image/') 
          ? generateThumbnailUrls(updatedMedia.file_url, updatedMedia.filename)
          : null,
      },
      message: 'Media updated successfully'
    });
  } catch (error) {
    console.error('Media update error:', error);
    return c.json({ error: 'Failed to update media' }, 500);
  }
});

/**
 * DELETE /api/media/:id - Delete media file
 */
media.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    // Get media details
    const media = await c.env.DB.prepare(
      'SELECT * FROM media_files WHERE id = ?'
    ).bind(id).first();

    if (!media) {
      return c.json({ error: 'Media not found' }, 404);
    }

    // Check permissions (only admin or uploader can delete)
    if (user.role !== 'admin' && user.id !== media.uploaded_by) {
      return c.json({ error: 'Permission denied' }, 403);
    }

    // Delete from R2
    const deleteResult = await deleteFromR2(media.file_path, c.env);
    if (!deleteResult) {
      console.warn(`Failed to delete file from R2: ${media.file_path}`);
    }

    // Delete from database (this will cascade delete usage records)
    await c.env.DB.prepare('DELETE FROM media_files WHERE id = ?').bind(id).run();

    return c.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Media delete error:', error);
    return c.json({ error: 'Failed to delete media' }, 500);
  }
});

/**
 * POST /api/media/categories - Create new category
 */
media.post('/categories', async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can create categories
    if (user.role !== 'admin') {
      return c.json({ error: 'Permission denied' }, 403);
    }

    const { name, description, color, parent_id } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Category name is required' }, 400);
    }

    // Generate slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    const existingCategory = await c.env.DB.prepare(
      'SELECT id FROM media_categories WHERE slug = ?'
    ).bind(slug).first();

    if (existingCategory) {
      return c.json({ error: 'Category with this name already exists' }, 400);
    }

    // Get max sort order
    const maxOrder = await c.env.DB.prepare(
      'SELECT MAX(sort_order) as max_order FROM media_categories'
    ).first();

    const sortOrder = (maxOrder?.max_order || 0) + 10;

    // Create category
    const categoryId = await c.env.DB.prepare(`
      INSERT INTO media_categories (name, slug, description, color, parent_id, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      slug,
      description || '',
      color || '#3B82F6',
      parent_id || null,
      sortOrder
    ).run();

    // Fetch created category
    const newCategory = await c.env.DB.prepare(`
      SELECT *, 0 as file_count FROM media_categories WHERE id = ?
    `).bind(categoryId.meta.last_row_id).first();

    return c.json({
      category: newCategory,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Category create error:', error);
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

/**
 * PUT /api/media/categories/:id - Update category
 */
media.put('/categories/:id', async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can update categories
    if (user.role !== 'admin') {
      return c.json({ error: 'Permission denied' }, 403);
    }

    const id = c.req.param('id');
    const { name, description, color, parent_id, sort_order } = await c.req.json();

    const existingCategory = await c.env.DB.prepare(
      'SELECT * FROM media_categories WHERE id = ?'
    ).bind(id).first();

    if (!existingCategory) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Update slug if name changed
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9\-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      // Check if new slug exists
      const slugExists = await c.env.DB.prepare(
        'SELECT id FROM media_categories WHERE slug = ? AND id != ?'
      ).bind(slug, id).first();

      if (slugExists) {
        return c.json({ error: 'Category with this name already exists' }, 400);
      }
    }

    // Update category
    await c.env.DB.prepare(`
      UPDATE media_categories 
      SET 
        name = ?,
        slug = ?,
        description = ?,
        color = ?,
        parent_id = ?,
        sort_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name || existingCategory.name,
      slug,
      description !== undefined ? description : existingCategory.description,
      color || existingCategory.color,
      parent_id !== undefined ? parent_id : existingCategory.parent_id,
      sort_order !== undefined ? sort_order : existingCategory.sort_order,
      id
    ).run();

    // Fetch updated category
    const updatedCategory = await c.env.DB.prepare(`
      SELECT 
        mc.*,
        COUNT(m.id) as file_count
      FROM media_categories mc
      LEFT JOIN media_files m ON mc.id = m.category_id
      WHERE mc.id = ?
      GROUP BY mc.id
    `).bind(id).first();

    return c.json({
      category: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Category update error:', error);
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

/**
 * DELETE /api/media/categories/:id - Delete category
 */
media.delete('/categories/:id', async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can delete categories
    if (user.role !== 'admin') {
      return c.json({ error: 'Permission denied' }, 403);
    }

    const id = c.req.param('id');

    // Check if category has files
    const fileCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM media_files WHERE category_id = ?'
    ).bind(id).first();

    if (fileCount && fileCount.count > 0) {
      return c.json({ 
        error: `Cannot delete category with ${fileCount.count} files. Move files to another category first.` 
      }, 400);
    }

    // Delete category
    const result = await c.env.DB.prepare(
      'DELETE FROM media_categories WHERE id = ?'
    ).bind(id).run();

    if (result.changes === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Category delete error:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

/**
 * POST /api/media/scan-bucket - Scan R2 bucket for all files (admin only)
 */
media.post('/scan-bucket', async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can scan the bucket
    if (user.role !== 'admin') {
      return c.json({ error: 'Permission denied' }, 403);
    }

    console.log('Starting R2 bucket scan...');
    const files = [];
    let cursor: string | undefined;
    let totalObjects = 0;

    // List all objects in the R2 bucket
    do {
      const options: any = { limit: 1000 };
      if (cursor) options.cursor = cursor;

      const listing = await c.env.IMAGES.list(options);
      
      for (const object of listing.objects) {
        files.push({
          key: object.key,
          size: object.size,
          uploaded: object.uploaded,
          etag: object.etag,
          httpEtag: object.httpEtag,
        });
        totalObjects++;
      }

      cursor = listing.truncated ? listing.cursor : undefined;
      console.log(`Scanned ${totalObjects} objects so far...`);
      
    } while (cursor);

    console.log(`R2 bucket scan completed: ${totalObjects} files found`);

    return c.json({
      success: true,
      files,
      total: totalObjects,
      message: `Found ${totalObjects} files in R2 bucket`
    });

  } catch (error) {
    console.error('R2 bucket scan error:', error);
    return c.json({ 
      error: 'Failed to scan R2 bucket',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/media/import-file - Import a single file into media library (admin only)
 */
media.post('/import-file', async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can import files
    if (user.role !== 'admin') {
      return c.json({ error: 'Permission denied' }, 403);
    }

    const fileData = await c.req.json();
    
    // Validate required fields
    if (!fileData.filename || !fileData.file_path || !fileData.file_url) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if file already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM media_files WHERE file_path = ?'
    ).bind(fileData.file_path).first();

    if (existing) {
      return c.json({ 
        success: false, 
        error: 'File already exists in database',
        file_path: fileData.file_path
      });
    }

    // Insert into database
    const result = await c.env.DB.prepare(`
      INSERT INTO media_files (
        filename, original_filename, title, alt_text, caption, description,
        file_path, file_url, file_type, file_size, mime_type, width, height,
        category_id, uploaded_by, upload_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      fileData.filename,
      fileData.original_filename || fileData.filename,
      fileData.title || fileData.filename,
      fileData.alt_text || '',
      fileData.caption || '',
      fileData.description || '',
      fileData.file_path,
      fileData.file_url,
      fileData.file_type || 'file',
      fileData.file_size || 0,
      fileData.mime_type || 'application/octet-stream',
      fileData.width || null,
      fileData.height || null,
      fileData.category_id || 1, // Default to General category
      fileData.uploaded_by || user.id,
      fileData.upload_date || new Date().toISOString()
    ).run();

    return c.json({
      success: true,
      media_id: result.meta.last_row_id,
      message: 'File imported successfully'
    });

  } catch (error) {
    console.error('File import error:', error);
    return c.json({ 
      error: 'Failed to import file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Fix AVIF MIME types endpoint
media.post('/fix-avif-mime', async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can fix MIME types
    if (user.role !== 'admin') {
      return c.json({ error: 'Permission denied' }, 403);
    }

    const { file_ids } = await c.req.json();
    
    if (!Array.isArray(file_ids) || file_ids.length === 0) {
      return c.json({ error: 'file_ids array is required' }, 400);
    }

    console.log(`Fixing MIME types for file IDs: ${file_ids.join(', ')}`);

    // Update MIME type and file type for AVIF files
    const placeholders = file_ids.map(() => '?').join(',');
    const updateQuery = `
      UPDATE media_files 
      SET 
        mime_type = 'image/avif',
        file_type = 'image'
      WHERE id IN (${placeholders})
        AND filename LIKE '%.avif'
        AND mime_type = 'application/octet-stream'
    `;

    const result = await c.env.DB.prepare(updateQuery).bind(...file_ids).run();

    return c.json({
      success: true,
      updated_count: result.changes || 0,
      message: `Updated ${result.changes || 0} AVIF files with correct MIME types`
    });

  } catch (error) {
    console.error('AVIF MIME fix error:', error);
    return c.json({ 
      error: 'Failed to fix AVIF MIME types',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Image proxy endpoint to serve images with proper CORS headers
// This bypasses CORS issues with the R2 bucket
media.get('/proxy/:path{.*}', async (c) => {
  try {
    const path = c.req.param('path');
    
    // Get the file from R2
    const object = await c.env.IMAGES.get(path);
    
    if (!object) {
      return c.text('File not found', 404);
    }

    // Get the file content and metadata
    const data = await object.arrayBuffer();
    
    // Determine content type from the file extension or object metadata
    const contentType = object.httpMetadata?.contentType || 
      getContentTypeFromPath(path) || 
      'application/octet-stream';

    // Return the file with proper CORS headers
    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
        'Content-Length': data.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return c.text('Internal server error', 500);
  }
});

// Helper function to determine content type from file path
function getContentTypeFromPath(path: string): string {
  const ext = path.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'ico': 'image/x-icon',
    'avif': 'image/avif',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'pdf': 'application/pdf',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

export { media };