// R2 Media Storage Utilities
// WordPress-compatible file paths and media management

export interface MediaUploadResult {
  filename: string;
  originalFilename: string;
  filePath: string; // WordPress-style: /wp-content/uploads/2024/01/filename.jpg
  fileUrl: string; // CDN URL
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface MediaFileInfo {
  filename: string;
  size: number;
  type: string;
  buffer: ArrayBuffer;
}

/**
 * Generate year-based file path for R2
 * Format: YYYY/MM/filename.ext (directly off root, matching existing structure)
 */
export function generateWordPressPath(filename: string, date?: Date): string {
  const uploadDate = date || new Date();
  const year = uploadDate.getFullYear();
  const month = String(uploadDate.getMonth() + 1).padStart(2, '0');
  
  return `${year}/${month}/${filename}`;
}

/**
 * Generate unique filename to prevent conflicts
 * Format: original-name-timestamp.ext or original-name-timestamp-counter.ext
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  // Extract extension
  const lastDot = originalName.lastIndexOf('.');
  const name = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
  const extension = lastDot > 0 ? originalName.substring(lastDot) : '';
  
  // Clean filename - remove special chars, spaces to dashes
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${cleanName}-${timestamp}-${randomSuffix}${extension}`;
}

/**
 * Upload file to R2 with WordPress-compatible structure
 */
export async function uploadToR2(
  file: MediaFileInfo,
  env: any,
  customPath?: string
): Promise<MediaUploadResult> {
  const uniqueFilename = generateUniqueFilename(file.filename);
  const filePath = customPath || generateWordPressPath(uniqueFilename);
  
  // R2 key uses year-based structure directly: YYYY/MM/filename.ext
  const r2Key = filePath;
  
  try {
    // Upload to R2 using IMAGES binding
    await env.IMAGES.put(r2Key, file.buffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });
    
    // Get public URL from settings
    const cdnUrl = await getCdnUrl(env);
    const fileUrl = `${cdnUrl}/${filePath}`;
    
    // Get image dimensions if it's an image
    const dimensions = await getImageDimensions(file.buffer, file.type);
    
    return {
      filename: uniqueFilename,
      originalFilename: file.filename,
      filePath,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      width: dimensions?.width,
      height: dimensions?.height,
    };
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(filePath: string, env: any): Promise<boolean> {
  try {
    // filePath is already in the correct format: YYYY/MM/filename.ext
    await env.IMAGES.delete(filePath);
    return true;
  } catch (error) {
    console.error('R2 delete failed:', error);
    return false;
  }
}

/**
 * Check if file exists in R2
 */
export async function fileExistsInR2(filePath: string, env: any): Promise<boolean> {
  try {
    // filePath is already in the correct format: YYYY/MM/filename.ext
    const object = await env.IMAGES.head(filePath);
    return object !== null;
  } catch {
    return false;
  }
}

/**
 * Get CDN URL from settings
 */
async function getCdnUrl(env: any): Promise<string> {
  try {
    const result = await env.DB.prepare(
      'SELECT value FROM settings WHERE key = ?'
    ).bind('r2_public_url').first();
    
    return result?.value || 'https://cdn.cruisemadeeasy.com';
  } catch {
    return 'https://cdn.cruisemadeeasy.com';
  }
}

/**
 * Get image dimensions using basic image header parsing
 */
async function getImageDimensions(
  buffer: ArrayBuffer, 
  mimeType: string
): Promise<{ width: number; height: number } | null> {
  if (!mimeType.startsWith('image/')) {
    return null;
  }
  
  try {
    // Simple dimension extraction for common formats
    const uint8Array = new Uint8Array(buffer);
    
    if (mimeType === 'image/png') {
      return getPngDimensions(uint8Array);
    } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return getJpegDimensions(uint8Array);
    } else if (mimeType === 'image/gif') {
      return getGifDimensions(uint8Array);
    } else if (mimeType === 'image/webp') {
      return getWebpDimensions(uint8Array);
    }
  } catch (error) {
    console.error('Failed to extract image dimensions:', error);
  }
  
  return null;
}

/**
 * Extract PNG dimensions from header
 */
function getPngDimensions(data: Uint8Array): { width: number; height: number } | null {
  if (data.length < 24 || 
      data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4E || data[3] !== 0x47) {
    return null;
  }
  
  const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
  const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
  
  return { width, height };
}

/**
 * Extract JPEG dimensions from header
 */
function getJpegDimensions(data: Uint8Array): { width: number; height: number } | null {
  if (data.length < 4 || data[0] !== 0xFF || data[1] !== 0xD8) {
    return null;
  }
  
  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xFF) break;
    
    const marker = data[offset + 1];
    if (marker === 0xC0 || marker === 0xC2) { // SOF0 or SOF2
      if (offset + 9 < data.length) {
        const height = (data[offset + 5] << 8) | data[offset + 6];
        const width = (data[offset + 7] << 8) | data[offset + 8];
        return { width, height };
      }
    }
    
    const length = (data[offset + 2] << 8) | data[offset + 3];
    offset += 2 + length;
  }
  
  return null;
}

/**
 * Extract GIF dimensions from header
 */
function getGifDimensions(data: Uint8Array): { width: number; height: number } | null {
  if (data.length < 10 ||
      (data[0] !== 0x47 || data[1] !== 0x49 || data[2] !== 0x46)) {
    return null;
  }
  
  const width = data[6] | (data[7] << 8);
  const height = data[8] | (data[9] << 8);
  
  return { width, height };
}

/**
 * Extract WebP dimensions from header
 */
function getWebpDimensions(data: Uint8Array): { width: number; height: number } | null {
  if (data.length < 30 ||
      data[0] !== 0x52 || data[1] !== 0x49 || data[2] !== 0x46 || data[3] !== 0x46 ||
      data[8] !== 0x57 || data[9] !== 0x45 || data[10] !== 0x42 || data[11] !== 0x50) {
    return null;
  }
  
  if (data[12] === 0x56 && data[13] === 0x50 && data[14] === 0x38 && data[15] === 0x20) {
    // VP8
    const width = ((data[26] | (data[27] << 8)) & 0x3fff);
    const height = ((data[28] | (data[29] << 8)) & 0x3fff);
    return { width, height };
  }
  
  return null;
}

/**
 * Generate WordPress-style thumbnail URLs
 */
export function generateThumbnailUrls(
  baseUrl: string, 
  filename: string
): { [size: string]: string } {
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const extension = lastDot > 0 ? filename.substring(lastDot) : '';
  
  const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
  
  return {
    thumbnail: `${basePath}${name}-150x150${extension}`,
    medium: `${basePath}${name}-300x300${extension}`,
    medium_large: `${basePath}${name}-768x768${extension}`,
    large: `${basePath}${name}-1024x1024${extension}`,
    full: baseUrl,
  };
}

/**
 * Validate file type for media library
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mp3',
    'audio/wav',
    'application/pdf'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Size limit: 10MB for images, 50MB for videos
  const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size too large. Maximum: ${Math.round(maxSize / (1024 * 1024))}MB` 
    };
  }
  
  return { valid: true };
}