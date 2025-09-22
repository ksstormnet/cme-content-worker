#!/usr/bin/env node

/**
 * Simple CSS extraction test (JavaScript version)
 */

const extractGenerateBlocksCSS = async (pageUrl) => {
  try {
    const response = await fetch(pageUrl);
    
    if (!response.ok) {
      console.warn(`Failed to fetch page: ${pageUrl} (${response.status})`);
      return null;
    }
    
    const html = await response.text();
    
    // Extract GenerateBlocks element IDs
    const elementIds = [];
    const regex = /gb-element-([a-f0-9]+)/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const elementId = match[1];
      if (!elementIds.includes(elementId)) {
        elementIds.push(elementId);
      }
    }
    
    // Extract CSS content from style tags
    let cssContent = '';
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let cssMatch;
    
    while ((cssMatch = styleTagRegex.exec(html)) !== null) {
      cssContent += cssMatch[1] + '\n';
    }
    
    // Extract CSS for each element
    const elementStyles = {};
    
    for (const elementId of elementIds) {
      const elementClass = `gb-element-${elementId}`;
      const escapedClass = elementClass.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      // Find CSS rules for this element
      const cssRules = [];
      const mediaQueries = {};
      
      // Basic rules: .gb-element-id { rules }
      const classRuleRegex = new RegExp(`\\.${escapedClass}\\s*{([^}]+)}`, 'gi');
      let ruleMatch;
      
      while ((ruleMatch = classRuleRegex.exec(cssContent)) !== null) {
        const rules = ruleMatch[1].trim();
        if (rules) {
          cssRules.push(rules);
        }
      }
      
      // Media query rules
      const mediaQueryRegex = /@media\s*([^{]+)\s*{([^{}]*(?:{[^}]*}[^{}]*)*)}/gi;
      let mediaMatch;
      
      while ((mediaMatch = mediaQueryRegex.exec(cssContent)) !== null) {
        const mediaCondition = mediaMatch[1].trim();
        const mediaContent = mediaMatch[2];
        
        const elementInMedia = new RegExp(`\\.${escapedClass}\\s*{([^}]+)}`, 'gi');
        let elementMatch;
        
        while ((elementMatch = elementInMedia.exec(mediaContent)) !== null) {
          if (!mediaQueries[mediaCondition]) {
            mediaQueries[mediaCondition] = [];
          }
          mediaQueries[mediaCondition].push(elementMatch[1].trim());
        }
      }
      
      if (cssRules.length > 0 || Object.keys(mediaQueries).length > 0) {
        elementStyles[elementId] = {
          elementId,
          cssRules,
          mediaQueries
        };
      }
    }
    
    return {
      url: pageUrl,
      elementIds,
      elementStyles,
      extractedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error extracting CSS from ${pageUrl}:`, error);
    return null;
  }
};

const testCSSExtraction = async () => {
  console.log('CME Content Worker - CSS Extraction Test');
  console.log('========================================\n');
  
  const testUrl = 'https://cruisemadeeasy.com/weekend-wanderlust-repositioning-routes-hidden-gems/';
  
  console.log(`Extracting CSS from: ${testUrl}`);
  console.log('This may take a few seconds...\n');
  
  const result = await extractGenerateBlocksCSS(testUrl);
  
  if (!result) {
    console.error('Failed to extract CSS data');
    return;
  }
  
  console.log('='.repeat(60));
  console.log('EXTRACTION RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\nURL: ${result.url}`);
  console.log(`Extracted at: ${result.extractedAt}`);
  console.log(`Found GenerateBlocks element IDs: ${result.elementIds.length}`);
  console.log(`Element IDs: ${result.elementIds.join(', ')}`);
  console.log(`Elements with CSS: ${Object.keys(result.elementStyles).length}`);
  
  // Display each element's CSS
  for (const [elementId, styles] of Object.entries(result.elementStyles)) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`gb-element-${elementId}`);
    console.log('='.repeat(40));
    
    if (styles.cssRules.length > 0) {
      console.log('CSS Rules:');
      for (const rule of styles.cssRules) {
        console.log(`  ${rule}`);
      }
    }
    
    if (Object.keys(styles.mediaQueries).length > 0) {
      console.log('\nMedia Queries:');
      for (const [media, rules] of Object.entries(styles.mediaQueries)) {
        console.log(`  @media ${media}:`);
        for (const rule of rules) {
          console.log(`    ${rule}`);
        }
      }
    }
    
    // Generate complete CSS for this element
    console.log('\nGenerated CSS:');
    console.log(`  .gb-element-${elementId} {`);
    for (const rule of styles.cssRules) {
      console.log(`    ${rule}`);
    }
    console.log('  }');
    
    for (const [media, rules] of Object.entries(styles.mediaQueries)) {
      console.log(`  @media ${media} {`);
      console.log(`    .gb-element-${elementId} {`);
      for (const rule of rules) {
        console.log(`      ${rule}`);
      }
      console.log('    }');
      console.log('  }');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Successfully extracted CSS for ${Object.keys(result.elementStyles).length} GenerateBlocks elements`);
  console.log('This demonstrates that we can extract element-specific CSS from published WordPress pages');
  console.log('and reconstruct the styling needed for proper rendering in our system.');
};

testCSSExtraction().catch(console.error);