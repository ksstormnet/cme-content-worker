#!/usr/bin/env node

/**
 * Upload template CSS files to R2 bucket
 * Automates the manual drag-and-drop process for template CSS assets
 *
 * Uploads both unminified and minified CSS files from the templates directory
 * to the R2 bucket under the blog-css/ prefix for CDN delivery.
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Template CSS source directory (external repository)
const CSS_SOURCE_DIR = '/data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates';
const R2_BUCKET = 'cruisemadeeasy-images';
const R2_PREFIX = 'blog-css';

console.log('🎨 Starting template CSS upload to R2...');

async function uploadTemplateCSS() {
  try {
    // Check if templates directory exists
    const dirExists = await checkDirectory(CSS_SOURCE_DIR);
    if (!dirExists) {
      console.error('❌ Templates directory not found:', CSS_SOURCE_DIR);
      process.exit(1);
    }

    // Get all CSS files (both unminified and minified)
    const allFiles = readdirSync(CSS_SOURCE_DIR);
    const cssFiles = allFiles.filter(file =>
      file.endsWith('.css') || file.endsWith('.min.css')
    ).sort(); // Sort for organized output

    if (cssFiles.length === 0) {
      console.warn('⚠️ No CSS files found to upload');
      return;
    }

    console.log(`📦 Found ${cssFiles.length} CSS files to upload:\n`);

    // Display files grouped by type
    const minifiedFiles = cssFiles.filter(f => f.endsWith('.min.css'));
    const unminifiedFiles = cssFiles.filter(f => !f.endsWith('.min.css'));

    console.log(`  Unminified: ${unminifiedFiles.length} files`);
    unminifiedFiles.forEach(file => {
      const filePath = join(CSS_SOURCE_DIR, file);
      const stats = statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`    - ${file} (${sizeKB} KB)`);
    });

    console.log(`\n  Minified: ${minifiedFiles.length} files`);
    minifiedFiles.forEach(file => {
      const filePath = join(CSS_SOURCE_DIR, file);
      const stats = statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`    - ${file} (${sizeKB} KB)`);
    });

    console.log('\n📤 Starting upload process...\n');

    // Upload each CSS file to R2
    let successCount = 0;
    let failCount = 0;

    for (const file of cssFiles) {
      const filePath = join(CSS_SOURCE_DIR, file);
      const r2Key = `${R2_PREFIX}/${file}`;

      console.log(`⬆️  Uploading ${file}...`);

      try {
        const { execSync } = await import('child_process');

        // Upload file to R2 using wrangler
        execSync(
          `wrangler r2 object put ${R2_BUCKET}/${r2Key} --file="${filePath}" --content-type="text/css" --remote`,
          { stdio: 'pipe' }
        );

        console.log(`✅ Successfully uploaded to r2://${R2_BUCKET}/${r2Key}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to upload ${file}:`, error.message);
        failCount++;
        // Continue with other files instead of exiting
      }
    }

    // Upload summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary:');
    console.log(`   ✅ Successful: ${successCount} files`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount} files`);
    }
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n🎉 CSS files uploaded successfully!');
      console.log(`📍 Assets available at: https://cdn.cruisemadeeasy.com/${R2_PREFIX}/[filename]`);
      console.log('\n📋 Example URLs:');
      console.log(`   https://cdn.cruisemadeeasy.com/${R2_PREFIX}/core-variables.min.css`);
      console.log(`   https://cdn.cruisemadeeasy.com/${R2_PREFIX}/component-header.min.css`);
    }

    if (failCount > 0) {
      console.error('\n⚠️ Some uploads failed. Check errors above.');
      process.exit(1);
    }

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

// Run the upload
uploadTemplateCSS();
