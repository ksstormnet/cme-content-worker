#!/usr/bin/env node

/**
 * Upload React build assets to R2 bucket
 * This script runs after `npm run build` to push JS/CSS assets to R2
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ASSETS_DIR = join(__dirname, '../dist/client/assets');
const R2_BUCKET = 'cruisemadeeasy-images';
const R2_PREFIX = 'built-js';

console.log('🚀 Starting R2 asset upload...');

async function uploadAssets() {
  try {
    // Check if assets directory exists
    const assetsExist = await checkDirectory(ASSETS_DIR);
    if (!assetsExist) {
      console.error('❌ Assets directory not found:', ASSETS_DIR);
      process.exit(1);
    }

    // Get list of asset files
    const files = readdirSync(ASSETS_DIR).filter(file => 
      file.endsWith('.js') || file.endsWith('.css')
    );

    if (files.length === 0) {
      console.warn('⚠️ No JS/CSS assets found to upload');
      return;
    }

    console.log(`📦 Found ${files.length} asset files to upload:`);
    files.forEach(file => {
      const filePath = join(ASSETS_DIR, file);
      const stats = statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`  - ${file} (${sizeKB} KB)`);
    });

    // Upload each file using wrangler r2 object put
    for (const file of files) {
      const filePath = join(ASSETS_DIR, file);
      const r2Key = `${R2_PREFIX}/${file}`;
      
      console.log(`⬆️ Uploading ${file} to R2...`);
      
      try {
        const { execSync } = await import('child_process');
        
        // Upload file to R2 using wrangler
        execSync(`wrangler r2 object put ${R2_BUCKET}/${r2Key} --file="${filePath}" --content-type="${getContentType(file)}"`, {
          stdio: 'pipe'
        });
        
        console.log(`✅ Successfully uploaded ${file} to r2://${R2_BUCKET}/${r2Key}`);
      } catch (error) {
        console.error(`❌ Failed to upload ${file}:`, error.message);
        process.exit(1);
      }
    }

    console.log('🎉 All assets uploaded successfully!');
    console.log(`📍 Assets available at: https://cdn.cruisemadeeasy.com/${R2_PREFIX}/[filename]`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

function checkDirectory(dir) {
  try {
    const stats = statSync(dir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function getContentType(filename) {
  if (filename.endsWith('.js')) return 'application/javascript';
  if (filename.endsWith('.css')) return 'text/css';
  return 'application/octet-stream';
}

// Run the upload
uploadAssets();