#!/usr/bin/env node

/**
 * Direct R2 Media Migration Script
 * Uploads images directly to R2 using wrangler commands
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  mediaDir: './wp-components/media',
  cdnBase: 'https://cdn.cruisemadeeasy.com',
  bucketName: 'cruisemadeeasy-images'
};

const migrationLog = {
  total: 0,
  uploaded: 0,
  failed: 0,
  errors: [],
  urlMappings: []
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
          const relativePath = path.relative(CONFIG.mediaDir, fullPath);
          const urlPath = relativePath.replace(/\\/g, '/');
          
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
 * Upload file to R2 using wrangler r2 object put
 */
async function uploadToR2Direct(imageInfo) {
  try {
    log(`Uploading: ${imageInfo.relativePath} (${Math.round(imageInfo.size / 1024)}KB)`);
    
    // R2 key path - preserve WordPress structure
    const r2Key = imageInfo.relativePath;
    
    // Upload using wrangler r2 object put
    const command = `npx wrangler r2 object put ${CONFIG.bucketName}/${r2Key} --file="${imageInfo.localPath}"`;
    
    await execAsync(command);
    
    const cdnUrl = `${CONFIG.cdnBase}/${r2Key}`;
    log(`✅ Uploaded: ${imageInfo.relativePath} -> ${cdnUrl}`);
    
    migrationLog.uploaded++;
    migrationLog.urlMappings.push({
      localPath: imageInfo.localPath,
      relativePath: imageInfo.relativePath, 
      wpPath: `/wp-content/uploads/${imageInfo.relativePath}`,
      cdnUrl: cdnUrl
    });
    
    return true;
    
  } catch (error) {
    log(`Failed to upload ${imageInfo.relativePath}: ${error.message}`, 'error');
    migrationLog.failed++;
    migrationLog.errors.push({
      file: imageInfo.relativePath,
      error: error.message
    });
    return false;
  }
}

/**
 * Generate database update SQL
 */
function generateDatabaseUpdateSQL(urlMappings) {
  const updates = [];
  
  // Update content blocks that reference old paths
  for (const mapping of urlMappings) {
    const sqlUpdate = `
-- Update references from ${mapping.wpPath} to ${mapping.cdnUrl}
UPDATE content_blocks 
SET content = REPLACE(content, '${mapping.wpPath}', '${mapping.cdnUrl}')
WHERE content LIKE '%${mapping.wpPath}%';

UPDATE posts 
SET content = REPLACE(content, '${mapping.wpPath}', '${mapping.cdnUrl}')
WHERE content LIKE '%${mapping.wpPath}%';

UPDATE posts 
SET featured_image_url = '${mapping.cdnUrl}'
WHERE featured_image_url = '${mapping.wpPath}';
`;
    updates.push(sqlUpdate);
  }
  
  return updates.join('\n');
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    log('🚀 Starting direct R2 media migration...');
    
    const images = getAllImageFiles(CONFIG.mediaDir);
    migrationLog.total = images.length;
    
    log(`Found ${images.length} images to migrate`);
    
    if (images.length === 0) {
      log('No images found to migrate');
      return;
    }
    
    // Upload images in smaller batches to avoid rate limits
    const batchSize = 3;
    
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(images.length/batchSize)}`);
      
      // Process batch sequentially to avoid overwhelming R2
      for (const img of batch) {
        await uploadToR2Direct(img);
        
        // Add small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Longer delay between batches
      if (i + batchSize < images.length) {
        log('⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Generate database update SQL
    const updateSQL = generateDatabaseUpdateSQL(migrationLog.urlMappings);
    fs.writeFileSync('./migration-db-updates.sql', updateSQL);
    
    // Final summary
    log('🎉 Migration completed!');
    log(`✅ Uploaded: ${migrationLog.uploaded}/${migrationLog.total} images`);
    log(`❌ Failed: ${migrationLog.failed} images`);
    
    if (migrationLog.errors.length > 0) {
      log('\n❌ Errors encountered:');
      migrationLog.errors.forEach(error => {
        log(`  ${error.file}: ${error.error}`, 'error');
      });
    }
    
    // Save complete migration log
    fs.writeFileSync('./migration-direct-log.json', JSON.stringify(migrationLog, null, 2));
    log('📋 Migration log saved to migration-direct-log.json');
    log('📋 Database update SQL saved to migration-db-updates.sql');
    
    log('\n🔧 Next steps:');
    log('1. Review migration-db-updates.sql');
    log('2. Execute SQL updates against your database');
    log('3. Test image loading on your site');
    
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