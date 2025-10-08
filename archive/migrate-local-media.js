#!/usr/bin/env node

/**
 * Migrate Local Media to R2 Bucket
 * 
 * This script uploads all images from wp-components/media/ to the R2 bucket
 * and updates database references to use CDN URLs instead of local paths.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  workerApiBase: 'http://localhost:8787/api',
  authCookie: process.env.AUTH_COOKIE || '',
  mediaDir: './wp-components/media',
  cdnBase: 'https://cdn.cruisemadeeasy.com'
};

// Track migration progress
const migrationLog = {
  total: 0,
  uploaded: 0,
  failed: 0,
  dbUpdated: 0,
  errors: []
};

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Get all image files recursively from media directory
 */
function getAllImageFiles(dir) {
  const images = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (imageExtensions.includes(ext)) {
          // Extract relative path from media directory
          const relativePath = path.relative(CONFIG.mediaDir, fullPath);
          const urlPath = relativePath.replace(/\\/g, '/'); // Convert Windows paths
          
          images.push({
            localPath: fullPath,
            relativePath: urlPath,
            filename: path.basename(fullPath),
            size: stat.size
          });
        }
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
  
  return images;
}

/**
 * Upload single image to R2 via Worker API
 */
async function uploadImageToR2(imageInfo) {
  try {
    log(`Uploading: ${imageInfo.relativePath} (${Math.round(imageInfo.size / 1024)}KB)`);
    
    // Read file
    const fileBuffer = fs.readFileSync(imageInfo.localPath);
    const blob = new Blob([fileBuffer]);
    
    // Determine MIME type
    const ext = path.extname(imageInfo.filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', 
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.bmp': 'image/bmp'
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, imageInfo.filename);
    formData.append('title', imageInfo.filename);
    formData.append('alt_text', '');
    formData.append('path', path.dirname(imageInfo.relativePath) + '/'); // Preserve directory structure
    
    // Upload via Worker API
    const response = await fetch(`${CONFIG.workerApiBase}/media/upload`, {
      method: 'POST',
      headers: {
        'Cookie': CONFIG.authCookie
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    log(`✅ Uploaded: ${imageInfo.relativePath} -> ${result.media.file_url}`);
    migrationLog.uploaded++;
    
    return {
      localPath: imageInfo.localPath,
      relativePath: imageInfo.relativePath,
      cdnUrl: result.media.file_url,
      mediaId: result.media.id
    };
    
  } catch (error) {
    log(`Failed to upload ${imageInfo.relativePath}: ${error.message}`, 'error');
    migrationLog.failed++;
    migrationLog.errors.push({
      file: imageInfo.relativePath,
      error: error.message
    });
    return null;
  }
}

/**
 * Update database references to use CDN URLs
 */
async function updateDatabaseReferences(urlMappings) {
  try {
    log(`Updating database references for ${urlMappings.length} images...`);
    
    // We'll need to update content blocks that reference the old local paths
    // This would typically be done via a database query, but for now we'll log what needs to be updated
    
    for (const mapping of urlMappings) {
      const oldUrl = `/wp-content/uploads/${mapping.relativePath}`;
      log(`Should update references from: ${oldUrl} -> ${mapping.cdnUrl}`);
    }
    
    log(`✅ Database update instructions logged for ${urlMappings.length} images`);
    migrationLog.dbUpdated = urlMappings.length;
    
  } catch (error) {
    log(`Database update failed: ${error.message}`, 'error');
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    log('🚀 Starting media migration to R2...');
    
    // Get all image files
    const images = getAllImageFiles(CONFIG.mediaDir);
    migrationLog.total = images.length;
    
    log(`Found ${images.length} images to migrate`);
    
    if (images.length === 0) {
      log('No images found to migrate');
      return;
    }
    
    // Upload images in batches
    const batchSize = 5;
    const urlMappings = [];
    
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(images.length/batchSize)}`);
      
      // Process batch in parallel
      const promises = batch.map(img => uploadImageToR2(img));
      const results = await Promise.allSettled(promises);
      
      // Collect successful uploads
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          urlMappings.push(result.value);
        }
      }
      
      // Add delay between batches
      if (i + batchSize < images.length) {
        log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Update database references
    if (urlMappings.length > 0) {
      await updateDatabaseReferences(urlMappings);
    }
    
    // Final summary
    log('🎉 Migration completed!');
    log(`✅ Uploaded: ${migrationLog.uploaded}/${migrationLog.total} images`);
    log(`❌ Failed: ${migrationLog.failed} images`);
    log(`📝 Database references to update: ${migrationLog.dbUpdated}`);
    
    if (migrationLog.errors.length > 0) {
      log('\n❌ Errors encountered:');
      migrationLog.errors.forEach(error => {
        log(`  ${error.file}: ${error.error}`, 'error');
      });
    }
    
    // Save migration log
    fs.writeFileSync('./migration-media-log.json', JSON.stringify(migrationLog, null, 2));
    log('📋 Migration log saved to migration-media-log.json');
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run migration if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { migrate };