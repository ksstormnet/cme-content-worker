import { Env } from '../types/database'

export interface ImageVariants {
  original: string
  thumbnail: string      // 150x150
  social: string         // 1024x768 for Twitter/OG
  responsive: {
    small: string        // 320w
    medium: string       // 768w
    large: string        // 1200w
  }
  webp?: {
    original: string
    thumbnail: string
    social: string
  }
  width?: number
  height?: number
  alt_text?: string
}

export interface ImageUploadResult {
  id: string
  variants: ImageVariants
  r2_key: string
  filename: string
}

// Upload image to R2 and generate all variants
export async function uploadImageToR2(
  file: File | ArrayBuffer, 
  filename: string,
  altText: string,
  env: Env
): Promise<ImageUploadResult> {
  // 1. Generate unique ID and filename
  const imageId = generateUniqueId()
  const ext = getFileExtension(filename)
  const uniqueFilename = `${imageId}.${ext}`
  
  // 2. Create R2 path with year/month organization
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const r2Key = `blog-images/${year}/${month}/${uniqueFilename}`
  
  // 3. Upload full-size to R2
  const fileData = file instanceof File ? await file.arrayBuffer() : file
  await env.IMAGES.put(r2Key, fileData, {
    httpMetadata: {
      contentType: getMimeType(ext),
      cacheControl: 'public, max-age=31536000', // 1 year cache
    },
    customMetadata: {
      originalFilename: filename,
      altText: altText,
      uploadedAt: now.toISOString(),
    }
  })
  
  // 4. Get image dimensions if possible
  const dimensions = await getImageDimensions(fileData, ext)
  
  // 5. Generate Cloudflare Image Resizing URLs
  const baseUrl = `https://cruisemadeeasy.com/${r2Key}` // Use main domain for Image Resizing
  const variants = generateImageVariants(baseUrl, dimensions, altText)
  
  // 6. Store in database
  await env.DB.prepare(`
    INSERT INTO images (id, filename, original_filename, r2_key, mime_type, file_size, width, height, alt_text, variants_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    imageId, 
    uniqueFilename, 
    filename,
    r2Key, 
    getMimeType(ext), 
    fileData.byteLength,
    dimensions?.width || null,
    dimensions?.height || null,
    altText,
    JSON.stringify(variants),
    now.toISOString()
  ).run()
  
  return { 
    id: imageId, 
    variants, 
    r2_key: r2Key, 
    filename: uniqueFilename 
  }
}

// Generate all Cloudflare Image Resizing URLs
function generateImageVariants(baseUrl: string, dimensions?: { width: number, height: number }, altText?: string): ImageVariants {
  return {
    original: baseUrl,
    thumbnail: `${baseUrl}/cdn-cgi/image/width=150,height=150,fit=cover,quality=85`,
    social: `${baseUrl}/cdn-cgi/image/width=1024,height=768,fit=cover,quality=85`,
    responsive: {
      small: `${baseUrl}/cdn-cgi/image/width=320,quality=85`,
      medium: `${baseUrl}/cdn-cgi/image/width=768,quality=85`, 
      large: `${baseUrl}/cdn-cgi/image/width=1200,quality=85`
    },
    webp: {
      original: `${baseUrl}/cdn-cgi/image/format=webp,quality=85`,
      thumbnail: `${baseUrl}/cdn-cgi/image/width=150,height=150,format=webp,fit=cover,quality=85`,
      social: `${baseUrl}/cdn-cgi/image/width=1024,height=768,format=webp,fit=cover,quality=85`
    },
    width: dimensions?.width,
    height: dimensions?.height,
    alt_text: altText
  }
}

// Get image variants from database by ID
export async function getImageVariants(imageId: string, env: Env): Promise<ImageVariants | null> {
  const image = await env.DB.prepare(`
    SELECT variants_json, alt_text, width, height FROM images WHERE id = ?
  `).bind(imageId).first()
  
  if (!image || !image.variants_json) {
    return null
  }
  
  const variants = JSON.parse(image.variants_json as string) as ImageVariants
  
  // Ensure alt_text and dimensions are populated
  variants.alt_text = variants.alt_text || image.alt_text as string
  variants.width = variants.width || image.width as number
  variants.height = variants.height || image.height as number
  
  return variants
}

// Get all images with pagination and filtering
export async function getImagesWithVariants(
  env: Env, 
  limit: number = 20, 
  offset: number = 0,
  search?: string
): Promise<{ images: any[], total: number }> {
  let query = `
    SELECT id, filename, original_filename, r2_key, mime_type, file_size, 
           width, height, alt_text, variants_json, created_at
    FROM images
  `
  let countQuery = `SELECT COUNT(*) as total FROM images`
  let params: any[] = []
  
  if (search) {
    query += ` WHERE (original_filename LIKE ? OR alt_text LIKE ?)`
    countQuery += ` WHERE (original_filename LIKE ? OR alt_text LIKE ?)`
    const searchTerm = `%${search}%`
    params = [searchTerm, searchTerm]
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)
  
  const [images, totalResult] = await Promise.all([
    env.DB.prepare(query).bind(...params).all(),
    env.DB.prepare(countQuery).bind(...(search ? [params[0], params[1]] : [])).first()
  ])
  
  // Parse variants_json for each image
  const processedImages = (images.results || []).map(img => ({
    ...img,
    variants: img.variants_json ? JSON.parse(img.variants_json as string) : null
  }))
  
  return {
    images: processedImages,
    total: (totalResult as any)?.total || 0
  }
}

// Delete image from R2 and database
export async function deleteImageFromR2(imageId: string, env: Env): Promise<boolean> {
  try {
    // Get image info from database
    const image = await env.DB.prepare(`
      SELECT r2_key FROM images WHERE id = ?
    `).bind(imageId).first()
    
    if (!image) {
      return false
    }
    
    // Delete from R2
    await env.IMAGES.delete(image.r2_key as string)
    
    // Delete from database
    await env.DB.prepare(`DELETE FROM images WHERE id = ?`).bind(imageId).run()
    
    return true
  } catch (error) {
    console.error('Failed to delete image:', error)
    return false
  }
}

// Update image metadata (alt text, etc.)
export async function updateImageMetadata(
  imageId: string, 
  altText?: string, 
  env?: Env
): Promise<boolean> {
  if (!env) return false
  
  try {
    const updates: string[] = []
    const params: any[] = []
    
    if (altText !== undefined) {
      updates.push('alt_text = ?')
      params.push(altText)
    }
    
    if (updates.length === 0) return true
    
    params.push(imageId)
    
    await env.DB.prepare(`
      UPDATE images SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run()
    
    // Update variants_json with new alt_text if provided
    if (altText !== undefined) {
      const image = await env.DB.prepare(`
        SELECT variants_json FROM images WHERE id = ?
      `).bind(imageId).first()
      
      if (image && image.variants_json) {
        const variants = JSON.parse(image.variants_json as string)
        variants.alt_text = altText
        
        await env.DB.prepare(`
          UPDATE images SET variants_json = ? WHERE id = ?
        `).bind(JSON.stringify(variants), imageId).run()
      }
    }
    
    return true
  } catch (error) {
    console.error('Failed to update image metadata:', error)
    return false
  }
}

// Utility functions
function generateUniqueId(): string {
  // Generate a URL-safe unique ID
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${randomStr}`
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || 'jpg' : 'jpg'
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff'
  }
  
  return mimeTypes[extension] || 'image/jpeg'
}

// Basic image dimension detection (limited in Workers environment)
async function getImageDimensions(
  fileData: ArrayBuffer, 
  extension: string
): Promise<{ width: number, height: number } | null> {
  try {
    // This is a simplified dimension detector
    // For production, you might want to use a more robust image processing library
    if (extension === 'jpeg' || extension === 'jpg') {
      return getJPEGDimensions(fileData)
    } else if (extension === 'png') {
      return getPNGDimensions(fileData)
    }
    
    return null
  } catch (error) {
    console.warn('Failed to get image dimensions:', error)
    return null
  }
}

function getJPEGDimensions(fileData: ArrayBuffer): { width: number, height: number } | null {
  try {
    const view = new DataView(fileData)
    let offset = 2 // Skip SOI marker
    
    while (offset < view.byteLength) {
      const marker = view.getUint16(offset, false)
      offset += 2
      
      if (marker >= 0xFFC0 && marker <= 0xFFC3) {
        // SOF0, SOF1, SOF2, SOF3
        offset += 3 // Skip length and precision
        const height = view.getUint16(offset, false)
        const width = view.getUint16(offset + 2, false)
        return { width, height }
      } else {
        const length = view.getUint16(offset, false)
        offset += length
      }
    }
    
    return null
  } catch {
    return null
  }
}

function getPNGDimensions(fileData: ArrayBuffer): { width: number, height: number } | null {
  try {
    const view = new DataView(fileData)
    
    // Check PNG signature
    if (view.getUint32(0, false) !== 0x89504E47) return null
    
    // IHDR chunk should be at offset 8
    const width = view.getUint32(16, false)
    const height = view.getUint32(20, false)
    
    return { width, height }
  } catch {
    return null
  }
}

// Generate optimized image URLs for different contexts
export function getOptimizedImageUrl(
  baseUrl: string, 
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'jpeg' | 'png'
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  } = {}
): string {
  const params = new URLSearchParams()
  
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.quality) params.set('quality', options.quality.toString())
  if (options.format) params.set('format', options.format)
  if (options.fit) params.set('fit', options.fit)
  
  return `${baseUrl}/cdn-cgi/image/${params.toString()}`
}