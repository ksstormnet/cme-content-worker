#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test the import functionality with actual scanned data
 */
async function testImport() {
  console.log('Testing Import Functionality');
  console.log('============================');
  
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
  
  const BASE_URL = 'http://localhost:5174';
  
  // Test validation endpoint
  console.log('Testing validation endpoint...');
  try {
    const validationResponse = await fetch(`${BASE_URL}/api/import/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.AUTH_COOKIE || ''
      },
      body: JSON.stringify({
        content_plans_data: contentPlansData.slice(0, 5), // Test with 5 plans
        articles_data: articlesData.slice(0, 5) // Test with 5 articles
      })
    });
    
    if (validationResponse.ok) {
      const validation = await validationResponse.json();
      console.log('✅ Validation successful:');
      console.log(`   Content Plans: ${validation.data.content_plans.valid}/${validation.data.content_plans.total} valid`);
      console.log(`   Articles: ${validation.data.articles.valid}/${validation.data.articles.total} valid`);
    } else {
      console.error('❌ Validation failed:', validationResponse.status, await validationResponse.text());
      return;
    }
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return;
  }
  
  console.log('');
  
  // Test import content plans endpoint
  console.log('Testing content plans import...');
  try {
    const importResponse = await fetch(`${BASE_URL}/api/import/content-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.AUTH_COOKIE || ''
      },
      body: JSON.stringify({
        content_plans_data: contentPlansData.slice(0, 2) // Test with 2 plans
      })
    });
    
    if (importResponse.ok) {
      const importResult = await importResponse.json();
      console.log('✅ Content plans import successful:');
      console.log(`   Imported: ${importResult.data.imported}`);
      console.log(`   Skipped: ${importResult.data.skipped}`);
      if (importResult.data.errors) {
        console.log('   Errors:', importResult.data.errors);
      }
    } else {
      console.error('❌ Content plans import failed:', importResponse.status, await importResponse.text());
    }
  } catch (error) {
    console.error('❌ Content plans import error:', error.message);
  }
  
  console.log('');
  
  // Test import articles endpoint
  console.log('Testing articles import...');
  try {
    const importResponse = await fetch(`${BASE_URL}/api/import/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.AUTH_COOKIE || ''
      },
      body: JSON.stringify({
        articles_data: articlesData.slice(0, 2) // Test with 2 articles
      })
    });
    
    if (importResponse.ok) {
      const importResult = await importResponse.json();
      console.log('✅ Articles import successful:');
      console.log(`   Imported: ${importResult.data.imported}`);
      console.log(`   Skipped: ${importResult.data.skipped}`);
      if (importResult.data.errors) {
        console.log('   Errors:', importResult.data.errors);
      }
    } else {
      console.error('❌ Articles import failed:', importResponse.status, await importResponse.text());
    }
  } catch (error) {
    console.error('❌ Articles import error:', error.message);
  }
  
  console.log('\nImport test complete!');
  console.log('Note: To test with authentication, set AUTH_COOKIE environment variable');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testImport().catch(console.error);
}

export default testImport;