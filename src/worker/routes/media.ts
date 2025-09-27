// Media Library API Routes
// Comprehensive media management with categories and WordPress compatibility

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './auth';
import { 
  uploadImageToR2, 
  deleteImageFromR2, 
  getImageVariants,
  getImagesWithVariants,
  updateImageMetadata,
  getOptimizedImageUrl,
  type ImageUploadResult 
} from '../../utils/image-processing';

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
 * GET /api/media - List images with optional filtering
 */
media.get('/', async (c) => {
  try {
    const { search, page = '1', limit = '20' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await getImagesWithVariants(c.env, parseInt(limit), offset, search);

    return c.json({
      files: result.images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Media list error:', error);
    return c.json({ error: 'Failed to fetch images' }, 500);
  }
});

/**
 * GET /api/media/:id - Get specific image with variants
 */
media.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const image = await c.env.DB.prepare(`
      SELECT 
        i.*,
        u.name as uploaded_by_name
      FROM images i
      LEFT JOIN users u ON i.upload_user_id = u.id
      WHERE i.id = ?
    `).bind(id).first();

    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const variants = await getImageVariants(id, c.env);

    return c.json({
      image: {
        ...image,
        variants
      }
    });
  } catch (error) {
    console.error('Get image error:', error);
    return c.json({ error: 'Failed to fetch image' }, 500);
  }
});

/**
 * POST /api/media/upload - Upload new image file
 */
media.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('alt_text') as string || '';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'Only image files are supported' }, 400);
    }

    // Check file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return c.json({ error: 'File size exceeds 10MB limit' }, 400);
    }

    const user = c.get('user');

    // Upload to R2 with image processing
    const uploadResult: ImageUploadResult = await uploadImageToR2(
      file, 
      file.name,
      altText,
      c.env
    );

    // Fetch the complete record with variants
    const newImage = await c.env.DB.prepare(`
      SELECT 
        i.*,
        u.name as uploaded_by_name
      FROM images i
      LEFT JOIN users u ON i.upload_user_id = u.id
      WHERE i.id = ?
    `).bind(uploadResult.id).first();

    return c.json({ 
      image: {
        ...newImage,
        variants: uploadResult.variants
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, 500);
  }
});

/**
 * PUT /api/media/:id - Update image metadata
 */
media.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { alt_text } = await c.req.json();

    // Check if image exists
    const existingImage = await c.env.DB.prepare(
      'SELECT id FROM images WHERE id = ?'
    ).bind(id).first();

    if (!existingImage) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Update image metadata
    const success = await updateImageMetadata(id, alt_text, c.env);
    
    if (!success) {
      return c.json({ error: 'Failed to update image metadata' }, 500);
    }

    // Fetch updated record with variants
    const updatedImage = await c.env.DB.prepare(`
      SELECT 
        i.*,
        u.name as uploaded_by_name
      FROM images i
      LEFT JOIN users u ON i.upload_user_id = u.id
      WHERE i.id = ?
    `).bind(id).first();

    const variants = await getImageVariants(id, c.env);

    return c.json({
      image: {
        ...updatedImage,
        variants
      },
      message: 'Image updated successfully'
    });
  } catch (error) {
    console.error('Image update error:', error);
    return c.json({ error: 'Failed to update image' }, 500);
  }
});

/**
 * DELETE /api/media/:id - Delete image file
 */
media.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    // Get image details
    const image = await c.env.DB.prepare(
      'SELECT * FROM images WHERE id = ?'
    ).bind(id).first();

    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Check permissions (only admin or uploader can delete)
    if (user.role !== 'admin' && user.id !== image.upload_user_id) {
      return c.json({ error: 'Permission denied' }, 403);
    }

    // Delete from R2 and database
    const deleteResult = await deleteImageFromR2(id, c.env);
    
    if (!deleteResult) {
      return c.json({ error: 'Failed to delete image' }, 500);
    }

    return c.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Image delete error:', error);
    return c.json({ error: 'Failed to delete image' }, 500);
  }
});

/**
 * POST /api/media/optimize/:id - Generate optimized image URL
 */
media.post('/optimize/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const options = await c.req.json();

    // Get image from database
    const image = await c.env.DB.prepare(`
      SELECT r2_key FROM images WHERE id = ?
    `).bind(id).first();

    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const baseUrl = `https://cdn.cruisemadeeasy.com/${image.r2_key}`;
    const optimizedUrl = getOptimizedImageUrl(baseUrl, options);

    return c.json({
      optimized_url: optimizedUrl,
      options: options
    });
  } catch (error) {
    console.error('Image optimize error:', error);
    return c.json({ error: 'Failed to generate optimized URL' }, 500);
  }
});

/**
 * GET /api/media/proxy/:path{.*} - Image proxy with CORS headers
 */
media.get('/proxy/:path{.*}', async (c) => {
  try {
    const path = c.req.param('path');
    
    // Get the file from R2
    const object = await c.env.IMAGES.get(path);
    
    if (!object) {
      return c.text('Image not found', 404);
    }

    // Get the file content and metadata
    const data = await object.arrayBuffer();
    
    // Determine content type from the file extension or object metadata
    const contentType = object.httpMetadata?.contentType || 
      getContentTypeFromPath(path) || 
      'image/jpeg';

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