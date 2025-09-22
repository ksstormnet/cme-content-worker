#!/usr/bin/env node

/**
 * Test CSS extraction from WordPress posts
 * Demonstrates how to extract GenerateBlocks CSS from published pages
 */

import { WordPressCSSExtractor, GenerateBlocksCSSStorage } from './src/utils/wordpress-css-extractor.js';

const testCSSExtraction = async () => {
  console.log('CME Content Worker - CSS Extraction Test');
  console.log('========================================\n');

  const extractor = new WordPressCSSExtractor();
  
  // Test with the repositioning routes article we analyzed
  const testUrl = 'https://cruisemadeeasy.com/weekend-wanderlust-repositioning-routes-hidden-gems/';
  
  console.log(`Extracting CSS from: ${testUrl}`);
  console.log('This may take a few seconds...\n');
  
  try {
    const pageCSS = await extractor.extractPageCSS(testUrl);
    
    if (!pageCSS) {
      console.error('Failed to extract CSS data');
      return;
    }
    
    console.log('='.repeat(60));
    console.log('EXTRACTION RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\nURL: ${pageCSS.url}`);
    console.log(`Extracted at: ${pageCSS.extractedAt}`);
    console.log(`Found ${pageCSS.elementStyles.length} GenerateBlocks elements`);
    console.log(`Found ${Object.keys(pageCSS.globalCSSVariables).length} global CSS variables`);
    
    // Display global CSS variables
    if (Object.keys(pageCSS.globalCSSVariables).length > 0) {
      console.log('\n' + '='.repeat(40));
      console.log('GLOBAL CSS VARIABLES');
      console.log('='.repeat(40));
      for (const [varName, varValue] of Object.entries(pageCSS.globalCSSVariables)) {
        console.log(`--${varName}: ${varValue}`);
      }
    }
    
    // Display each GenerateBlocks element
    console.log('\n' + '='.repeat(40));
    console.log('GENERATEBLOCKS ELEMENTS');
    console.log('='.repeat(40));
    
    for (const elementStyle of pageCSS.elementStyles) {
      console.log(`\nElement: gb-element-${elementStyle.elementId}`);
      console.log('-'.repeat(30));
      
      if (elementStyle.cssRules.length > 0) {
        console.log('CSS Rules:');
        for (const rule of elementStyle.cssRules) {
          console.log(`  ${rule}`);
        }
      }
      
      if (Object.keys(elementStyle.mediaQueries).length > 0) {
        console.log('Media Queries:');
        for (const [media, rules] of Object.entries(elementStyle.mediaQueries)) {
          console.log(`  @media ${media}:`);
          for (const rule of rules) {
            console.log(`    ${rule}`);
          }
        }
      }
      
      if (elementStyle.cssVariables) {
        console.log('Element CSS Variables:');
        for (const [varName, varValue] of Object.entries(elementStyle.cssVariables)) {
          console.log(`  --${varName}: ${varValue}`);
        }
      }
    }
    
    // Generate consolidated CSS
    const consolidatedResult = extractor.consolidateStyles([pageCSS]);
    
    console.log('\n' + '='.repeat(40));
    console.log('CONSOLIDATED CSS OUTPUT');
    console.log('='.repeat(40));
    console.log(consolidatedResult.consolidatedCSS);
    
    // Test with multiple articles (just a couple to demonstrate)
    console.log('\n' + '='.repeat(60));
    console.log('TESTING MULTIPLE PAGES');
    console.log('='.repeat(60));
    
    const multipleUrls = [
      'https://cruisemadeeasy.com/weekend-wanderlust-repositioning-routes-hidden-gems/',
      'https://cruisemadeeasy.com/weekend-wanderlust-fall-foliage-from-the-sea-and-why-2026-is-your-better-play/'
    ];
    
    console.log(`Extracting CSS from ${multipleUrls.length} pages...`);
    const multipleResults = await extractor.extractMultiplePages(multipleUrls);
    
    console.log(`Successfully extracted CSS from ${multipleResults.length} pages`);
    
    let totalElements = 0;
    for (const result of multipleResults) {
      totalElements += result.elementStyles.length;
    }
    
    console.log(`Total GenerateBlocks elements found: ${totalElements}`);
    
    // Consolidate all styles
    const masterConsolidation = extractor.consolidateStyles(multipleResults);
    console.log(`Unique elements in registry: ${Object.keys(masterConsolidation.elementRegistry).length}`);
    console.log(`Global variables: ${Object.keys(masterConsolidation.globalVariables).length}`);
    
    console.log('\n' + '='.repeat(40));
    console.log('MASTER CSS REGISTRY ELEMENTS');
    console.log('='.repeat(40));
    for (const elementId of Object.keys(masterConsolidation.elementRegistry)) {
      console.log(`gb-element-${elementId}`);
    }
    
  } catch (error) {
    console.error('CSS extraction failed:', error.message);
    console.error(error.stack);
  }
};

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCSSExtraction().catch(console.error);
}

export default testCSSExtraction;