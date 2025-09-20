#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prepare import data for the React interface
 */
async function prepareImportData() {
  console.log('Preparing Import Data for React Interface');
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
  
  // Create a combined data file for the React interface
  const importData = {
    content_plans_data: contentPlansData,
    articles_data: articlesData,
    metadata: {
      scanned_at: new Date().toISOString(),
      content_plans_count: contentPlansData.length,
      articles_count: articlesData.length,
      date_range: {
        start: contentPlansData[0]?.week_start_date,
        end: contentPlansData[contentPlansData.length - 1]?.week_start_date
      }
    }
  };
  
  // Save to public directory so React can fetch it
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  
  const outputPath = path.join(publicDir, 'import-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(importData, null, 2));
  
  console.log(`✅ Import data prepared and saved to: ${outputPath}`);
  console.log(`   Content Plans: ${contentPlansData.length}`);
  console.log(`   Articles: ${articlesData.length}`);
  console.log(`   Date Range: ${importData.metadata.date_range.start} to ${importData.metadata.date_range.end}`);
  console.log('');
  console.log('Ready to use in React ImportInterface component!');
}

// Run the preparation
if (import.meta.url === `file://${process.argv[1]}`) {
  prepareImportData().catch(console.error);
}

export default prepareImportData;