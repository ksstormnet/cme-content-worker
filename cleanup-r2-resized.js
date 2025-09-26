#!/usr/bin/env node

/**
 * Clean up R2 bucket - Delete resized/thumbnail images, keep only originals
 * Cloudflare Image Resizing will handle variants on-demand
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CONFIG = {
  bucketName: 'cruisemadeeasy-images'
};

const cleanupLog = {
  scanned: 0,
  originals: 0,
  resized: 0,
  deleted: 0,
  failed: 0,
  errors: []
};

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Check if a filename appears to be a resized/thumbnail version
 * WordPress and other systems typically add size suffixes like:
 * - image-150x150.jpg (thumbnail)
 * - image-300x200.jpg (medium)
 * - image-1024x768.jpg (large)
 * - image-scaled.jpg (WordPress scaled version)
 */
function isResizedImage(filename) {
  const resizedPatterns = [
    /-\d+x\d+\.(jpg|jpeg|png|gif|webp|avif)$/i,    // -150x150.jpg, -300x200.png
    /-scaled\.(jpg|jpeg|png|gif|webp|avif)$/i,      // -scaled.jpg
    /-thumb\.(jpg|jpeg|png|gif|webp|avif)$/i,       // -thumb.jpg
    /-thumbnail\.(jpg|jpeg|png|gif|webp|avif)$/i,   // -thumbnail.jpg
    /-small\.(jpg|jpeg|png|gif|webp|avif)$/i,       // -small.jpg
    /-medium\.(jpg|jpeg|png|gif|webp|avif)$/i,      // -medium.jpg
    /-large\.(jpg|jpeg|png|gif|webp|avif)$/i,       // -large.jpg
    /-xl\.(jpg|jpeg|png|gif|webp|avif)$/i,          // -xl.jpg
    /-\d+\.(jpg|jpeg|png|gif|webp|avif)$/i          // -300.jpg (single dimension)
  ];
  
  return resizedPatterns.some(pattern => pattern.test(filename));
}

/**
 * Get list of uploaded images from migration log
 */
async function getUploadedImagesFromLog() {
  try {
    log('Reading migration log to identify uploaded images...');
    
    // Read our migration log to see what we uploaded
    const migrationLogPath = './migration-direct-log.json';
    if (!await fileExists(migrationLogPath)) {
      throw new Error('Migration log not found. Run migration first.');
    }
    
    const fs = await import('fs');
    const migrationLog = JSON.parse(fs.readFileSync(migrationLogPath, 'utf8'));
    
    if (!migrationLog.urlMappings || migrationLog.urlMappings.length === 0) {
      throw new Error('No URL mappings found in migration log');
    }
    
    log(`Found ${migrationLog.urlMappings.length} images in migration log`);
    
    // Extract just the relative paths (which become R2 keys)
    return migrationLog.urlMappings.map(mapping => ({
      key: mapping.relativePath,
      size: 0 // We don't have size info from migration log
    }));
    
  } catch (error) {
    log(`Failed to read migration log: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Check if file exists
 */
async function fileExists(path) {
  try {
    const fs = await import('fs');
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a single object from R2
 */
async function deleteR2Object(objectKey) {
  try {
    const command = `npx wrangler r2 object delete ${CONFIG.bucketName}/${objectKey}`;
    await execAsync(command);
    log(`🗑️  Deleted: ${objectKey}`);
    cleanupLog.deleted++;
    return true;
  } catch (error) {
    log(`Failed to delete ${objectKey}: ${error.message}`, 'error');
    cleanupLog.failed++;
    cleanupLog.errors.push({
      object: objectKey,
      error: error.message
    });
    return false;
  }
}

/**
 * Analyze and categorize all images
 */
function analyzeImages(objects) {
  const analysis = {
    originals: [],
    resized: [],
    other: []
  };
  
  for (const obj of objects) {
    cleanupLog.scanned++;
    
    // Check if it's an image file
    if (!/\.(jpg|jpeg|png|gif|webp|avif|bmp)$/i.test(obj.key)) {
      analysis.other.push(obj);
      continue;
    }
    
    if (isResizedImage(obj.key)) {
      analysis.resized.push(obj);
      cleanupLog.resized++;
    } else {
      analysis.originals.push(obj);
      cleanupLog.originals++;
    }
  }
  
  return analysis;
}

/**
 * Main cleanup function
 */
async function cleanupR2Bucket() {
  try {
    log('🚀 Starting R2 bucket cleanup...');
    log('📋 This will delete all resized/thumbnail images, keeping only originals');
    
    // Get uploaded images from migration log
    const objects = await getUploadedImagesFromLog();
    
    // Analyze images
    const analysis = analyzeImages(objects);
    
    log(`📊 Analysis complete:`);
    log(`   📸 Original images: ${analysis.originals.length}`);
    log(`   🔄 Resized images: ${analysis.resized.length}`);
    log(`   📄 Other files: ${analysis.other.length}`);
    
    if (analysis.resized.length === 0) {
      log('🎉 No resized images found - bucket is already clean!');
      return;
    }
    
    log(`🗑️  Will delete ${analysis.resized.length} resized images...`);
    
    // Show examples of what will be deleted
    log('📝 Examples of files to be deleted:');
    analysis.resized.slice(0, 5).forEach(obj => {
      log(`   - ${obj.key}`);
    });
    
    if (analysis.resized.length > 5) {
      log(`   ... and ${analysis.resized.length - 5} more`);
    }
    
    log('🔄 Starting deletion process...');
    
    // Delete resized images in batches
    const batchSize = 5;
    
    for (let i = 0; i < analysis.resized.length; i += batchSize) {
      const batch = analysis.resized.slice(i, i + batchSize);
      
      log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(analysis.resized.length/batchSize)}`);
      
      // Process batch sequentially to avoid overwhelming R2
      for (const obj of batch) {
        await deleteR2Object(obj.key);
        
        // Small delay between deletions
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Longer delay between batches
      if (i + batchSize < analysis.resized.length) {
        log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final summary
    log('🎉 R2 cleanup completed!');
    log(`📊 Summary:`);
    log(`   🔍 Scanned: ${cleanupLog.scanned} objects`);
    log(`   📸 Original images kept: ${cleanupLog.originals}`);
    log(`   🗑️  Resized images deleted: ${cleanupLog.deleted}/${cleanupLog.resized}`);
    log(`   ❌ Failed deletions: ${cleanupLog.failed}`);
    
    if (cleanupLog.errors.length > 0) {
      log('\n❌ Errors encountered:');
      cleanupLog.errors.forEach(error => {
        log(`  ${error.object}: ${error.error}`, 'error');
      });
    }
    
    log('\n✅ Benefits:');
    log('   • Reduced R2 storage costs');
    log('   • Cloudflare Image Resizing will handle all variants on-demand');
    log('   • Cleaner bucket structure with only source images');
    
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run cleanup if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupR2Bucket().catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
}

export { cleanupR2Bucket };