#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Import all content plans and articles
 */
async function fullImport() {
  console.log('Full Import - Content Plans and Articles');
  console.log('========================================');
  
  // Load the scanned data
  const contentPlansPath = path.join(__dirname, 'import-data', 'content-plans.json');
  const articlesPath = path.join(__dirname, 'import-data', 'articles.json');
  
  if (!fs.existsSync(contentPlansPath) || !fs.existsSync(articlesPath)) {
    console.error('Import data files not found. Please run scan-content.js first.');
    process.exit(1);
  }
  
  const contentPlansData = JSON.parse(fs.readFileSync(contentPlansPath, 'utf8'));
  const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
  
  console.log(`Loaded ${contentPlansData.length} content plans`);
  console.log(`Loaded ${articlesData.length} articles`);
  console.log('');
  
  const BASE_URL = 'http://localhost:8787';
  const AUTH_COOKIE = process.env.AUTH_COOKIE || '';
  
  if (!AUTH_COOKIE) {
    console.error('AUTH_COOKIE environment variable is required');
    console.error('Set it like: AUTH_COOKIE="auth_token=your_token_here" node full-import.js');
    process.exit(1);
  }
  
  // Import all content plans
  console.log('Importing all content plans...');
  try {
    const importResponse = await fetch(`${BASE_URL}/api/import/content-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': AUTH_COOKIE
      },
      body: JSON.stringify({
        content_plans_data: contentPlansData
      })
    });
    
    if (importResponse.ok) {
      const importResult = await importResponse.json();
      console.log('✅ Content plans import successful:');
      console.log(`   Imported: ${importResult.data.imported}`);
      console.log(`   Skipped: ${importResult.data.skipped}`);
      if (importResult.data.errors && importResult.data.errors.length > 0) {
        console.log('   Errors:', importResult.data.errors);
      }
    } else {
      const errorText = await importResponse.text();
      console.error('❌ Content plans import failed:', importResponse.status, errorText);
      return;
    }
  } catch (error) {
    console.error('❌ Content plans import error:', error.message);
    return;
  }
  
  console.log('');
  
  // Import all articles
  console.log('Importing all articles...');
  try {
    const importResponse = await fetch(`${BASE_URL}/api/import/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': AUTH_COOKIE
      },
      body: JSON.stringify({
        articles_data: articlesData
      })
    });
    
    if (importResponse.ok) {
      const importResult = await importResponse.json();
      console.log('✅ Articles import successful:');
      console.log(`   Imported: ${importResult.data.imported}`);
      console.log(`   Skipped: ${importResult.data.skipped}`);
      if (importResult.data.errors && importResult.data.errors.length > 0) {
        console.log('   Errors:', importResult.data.errors);
      }
    } else {
      const errorText = await importResponse.text();
      console.error('❌ Articles import failed:', importResponse.status, errorText);
      return;
    }
  } catch (error) {
    console.error('❌ Articles import error:', error.message);
    return;
  }
  
  console.log('\n🎉 Full import complete!');
  
  // Verify the import by checking database counts
  console.log('\nVerifying import...');
  try {
    const statsResponse = await fetch(`${BASE_URL}/api/calendar/stats`, {
      headers: {
        'Cookie': AUTH_COOKIE
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log(`✅ Database now contains:`);
      console.log(`   Content Plans: ${stats.data.content_plans || 0}`);
      console.log(`   Weekly Plans: ${stats.data.weekly_plans || 0}`);
      if (stats.data.posts !== undefined) {
        console.log(`   Posts: ${stats.data.posts}`);
      }
    }
  } catch (error) {
    console.log('Could not fetch verification stats:', error.message);
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  fullImport().catch(console.error);
}

export default fullImport;