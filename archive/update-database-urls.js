#!/usr/bin/env node

/**
 * Update Database Image URLs
 * Replace WordPress URLs with CDN URLs in the database
 */

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Execute SQL command via wrangler
 */
async function executeSql(command, description) {
  try {
    log(`Executing: ${description}`);
    const { stdout, stderr } = await execAsync(`npx wrangler d1 execute cme-content-db --command="${command}" --remote`);
    
    if (stderr && !stderr.includes('Executing on preview database')) {
      log(`Warning: ${stderr}`, 'warn');
    }
    
    const result = JSON.parse(stdout);
    if (result[0].success) {
      log(`✅ ${description} - Changes: ${result[0].meta.changes || 0}`);
      return result[0];
    } else {
      throw new Error(`SQL execution failed: ${JSON.stringify(result[0])}`);
    }
  } catch (error) {
    log(`Failed: ${description} - ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Update posts table with featured image URLs
 */
async function updateFeaturedImageUrls() {
  const updates = [
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/03/sunset-wake.jpg',
      new: 'https://cdn.cruisemadeeasy.com/2025/03/sunset-wake.jpg'
    },
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/08/hubbard-glacier.jpg',
      new: 'https://cdn.cruisemadeeasy.com/2025/08/hubbard-glacier.jpg'  // This might not exist in our upload
    },
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/qf8ifcw2oc8.jpg',
      new: 'https://cdn.cruisemadeeasy.com/2025/07/qf8ifcw2oc8.jpg'
    },
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/5676024.jpeg',
      new: 'https://cdn.cruisemadeeasy.com/2025/07/5676024.jpeg'
    },
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/3139127.jpg',
      new: 'https://cdn.cruisemadeeasy.com/2025/07/3139127.jpg'
    },
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/17230782.jpeg',
      new: 'https://cdn.cruisemadeeasy.com/2025/07/17230782.jpeg'
    },
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/k05udh2lhfa.jpg',
      new: 'https://cdn.cruisemadeeasy.com/2025/07/k05udh2lhfa.jpg'
    },
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/9305955-great-stirrup-cay-tidal-tower.jpg',
      new: 'https://cdn.cruisemadeeasy.com/2025/07/9305955-great-stirrup-cay-tidal-tower.jpg'
    },
    {
      old: 'https://cruisemadeeasy.com/wp-content/uploads/2025/03/1000x667NorwegianDrinksOnboard.webp',
      new: 'https://cdn.cruisemadeeasy.com/2025/03/1000x667NorwegianDrinksOnboard.webp'
    }
  ];

  let totalChanges = 0;

  for (const update of updates) {
    try {
      // Update featured_image_url in posts table
      const command = `UPDATE posts SET featured_image_url = '${update.new}' WHERE featured_image_url = '${update.old}'`;
      const result = await executeSql(command, `Update featured image: ${update.old.split('/').pop()}`);
      totalChanges += result.meta.changes || 0;
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      log(`Failed to update ${update.old}: ${error.message}`, 'error');
    }
  }

  return totalChanges;
}

/**
 * Update general image references in content
 */
async function updateContentReferences() {
  // Read the migration log to get all URL mappings
  if (!fs.existsSync('./migration-direct-log.json')) {
    log('Migration log not found, skipping content updates');
    return 0;
  }

  const migrationLog = JSON.parse(fs.readFileSync('./migration-direct-log.json', 'utf8'));
  let totalChanges = 0;

  // Update content blocks - batch by common patterns
  const commonPaths = [
    '/wp-content/uploads/2025/07/',
    '/wp-content/uploads/2025/03/', 
    '/wp-content/uploads/2025/02/',
    '/wp-content/uploads/2025/06/',
    '/wp-content/uploads/2025/05/',
    '/wp-content/uploads/2021/07/'
  ];

  for (const basePath of commonPaths) {
    try {
      const command = `UPDATE content_blocks SET content = REPLACE(content, '${basePath}', 'https://cdn.cruisemadeeasy.com/${basePath.replace('/wp-content/uploads/', '')}') WHERE content LIKE '%${basePath}%'`;
      const result = await executeSql(command, `Update content blocks for ${basePath}`);
      totalChanges += result.meta.changes || 0;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      log(`Failed to update content for ${basePath}: ${error.message}`, 'error');
    }
  }

  return totalChanges;
}

/**
 * Verify updates by checking remaining WordPress URLs
 */
async function verifyUpdates() {
  try {
    const command = `SELECT COUNT(*) as remaining FROM posts WHERE featured_image_url LIKE '%wp-content%'`;
    const result = await executeSql(command, 'Check remaining WordPress URLs');
    return result.results[0].remaining;
  } catch (error) {
    log(`Failed to verify updates: ${error.message}`, 'error');
    return -1;
  }
}

/**
 * Main update function
 */
async function updateDatabase() {
  try {
    log('🚀 Starting database URL updates...');
    
    // Update featured image URLs
    const featuredChanges = await updateFeaturedImageUrls();
    log(`✅ Updated ${featuredChanges} featured image URLs`);
    
    // Update content references
    const contentChanges = await updateContentReferences();
    log(`✅ Updated ${contentChanges} content references`);
    
    // Verify results
    const remaining = await verifyUpdates();
    if (remaining === 0) {
      log('🎉 All WordPress URLs successfully updated to CDN URLs!');
    } else if (remaining > 0) {
      log(`⚠️ ${remaining} WordPress URLs still remain - may need manual review`, 'warn');
    }
    
    log(`📊 Summary: ${featuredChanges + contentChanges} total changes made`);
    
  } catch (error) {
    log(`Database update failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  updateDatabase().catch(error => {
    console.error('Update failed:', error);
    process.exit(1);
  });
}

export { updateDatabase };