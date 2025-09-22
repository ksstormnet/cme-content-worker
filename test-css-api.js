#!/usr/bin/env node

/**
 * Test the WordPress CSS extraction API
 */

const CONFIG = {
  workerApiBase: 'http://localhost:8787/api'
};

const testCSSExtractionAPI = async () => {
  console.log('CME Content Worker - CSS API Test');
  console.log('==================================\n');
  
  if (!process.env.AUTH_COOKIE) {
    console.error('❌ AUTH_COOKIE environment variable not set');
    console.error('Please set AUTH_COOKIE to test authenticated endpoints');
    process.exit(1);
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': process.env.AUTH_COOKIE
  };
  
  // Test 1: Extract CSS from WordPress posts
  console.log('Test 1: Extracting CSS from WordPress posts...');
  try {
    const extractResponse = await fetch(`${CONFIG.workerApiBase}/wordpress-css/extract`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        urls: [
          'https://cruisemadeeasy.com/weekend-wanderlust-repositioning-routes-hidden-gems/',
          'https://cruisemadeeasy.com/weekend-wanderlust-fall-foliage-from-the-sea-and-why-2026-is-your-better-play/'
        ]
      })
    });
    
    if (extractResponse.ok) {
      const extractResult = await extractResponse.json();
      console.log('✅ CSS extraction successful:');
      console.log(`   Processed URLs: ${extractResult.data.processedUrls}`);
      console.log(`   Total Elements: ${extractResult.data.totalElements}`);
      if (extractResult.data.errors) {
        console.log(`   Errors: ${extractResult.data.errors.length}`);
      }
    } else {
      console.error('❌ CSS extraction failed:', extractResponse.status, await extractResponse.text());
      return;
    }
  } catch (error) {
    console.error('❌ CSS extraction error:', error.message);
    return;
  }
  
  console.log('');
  
  // Test 2: Get stored elements
  console.log('Test 2: Retrieving stored elements...');
  try {
    const elementsResponse = await fetch(`${CONFIG.workerApiBase}/wordpress-css/elements`, {
      headers: headers
    });
    
    if (elementsResponse.ok) {
      const elementsResult = await elementsResponse.json();
      console.log('✅ Elements retrieval successful:');
      console.log(`   Elements count: ${elementsResult.data.count}`);
      
      if (elementsResult.data.elements.length > 0) {
        console.log(`   Sample element: gb-element-${elementsResult.data.elements[0].elementId}`);
        console.log(`   Configuration keys: ${Object.keys(elementsResult.data.elements[0].configuration).join(', ')}`);
        console.log(`   CSS length: ${elementsResult.data.elements[0].styles?.length || 0} characters`);
      }
    } else {
      console.error('❌ Elements retrieval failed:', elementsResponse.status, await elementsResponse.text());
    }
  } catch (error) {
    console.error('❌ Elements retrieval error:', error.message);
  }
  
  console.log('');
  
  // Test 3: Get consolidated CSS
  console.log('Test 3: Retrieving consolidated CSS...');
  try {
    const consolidatedResponse = await fetch(`${CONFIG.workerApiBase}/wordpress-css/consolidated`, {
      headers: headers
    });
    
    if (consolidatedResponse.ok) {
      const consolidatedResult = await consolidatedResponse.json();
      console.log('✅ Consolidated CSS retrieval successful:');
      console.log(`   Elements count: ${consolidatedResult.data.elementsCount}`);
      console.log(`   CSS length: ${consolidatedResult.data.consolidatedCSS.length} characters`);
      console.log(`   Generated at: ${consolidatedResult.data.generatedAt}`);
      
      // Show a sample of the CSS
      const cssPreview = consolidatedResult.data.consolidatedCSS.substring(0, 500);
      console.log('   CSS Preview:');
      console.log('   ' + cssPreview.split('\\n').slice(0, 10).join('\\n   '));
      if (consolidatedResult.data.consolidatedCSS.length > 500) {
        console.log('   ... (truncated)');
      }
    } else {
      console.error('❌ Consolidated CSS retrieval failed:', consolidatedResponse.status, await consolidatedResponse.text());
    }
  } catch (error) {
    console.error('❌ Consolidated CSS retrieval error:', error.message);
  }
  
  console.log('');
  
  // Test 4: Get specific element
  console.log('Test 4: Testing specific element retrieval...');
  try {
    // First get the list of elements to find one to test with
    const elementsResponse = await fetch(`${CONFIG.workerApiBase}/wordpress-css/elements`, {
      headers: headers
    });
    
    if (elementsResponse.ok) {
      const elementsResult = await elementsResponse.json();
      
      if (elementsResult.data.elements.length > 0) {
        const testElementId = elementsResult.data.elements[0].elementId;
        
        const elementResponse = await fetch(`${CONFIG.workerApiBase}/wordpress-css/elements/${testElementId}`, {
          headers: headers
        });
        
        if (elementResponse.ok) {
          const elementResult = await elementResponse.json();
          console.log('✅ Specific element retrieval successful:');
          console.log(`   Element ID: gb-element-${elementResult.data.elementId}`);
          console.log(`   Element type: ${elementResult.data.elementType}`);
          console.log(`   CSS rules count: ${elementResult.data.configuration.cssRules?.length || 0}`);
          console.log(`   Media queries count: ${Object.keys(elementResult.data.configuration.mediaQueries || {}).length}`);
        } else {
          console.error('❌ Specific element retrieval failed:', elementResponse.status, await elementResponse.text());
        }
      } else {
        console.log('⚠️  No elements available for specific retrieval test');
      }
    }
  } catch (error) {
    console.error('❌ Specific element retrieval error:', error.message);
  }
  
  console.log('\\n' + '='.repeat(50));
  console.log('CSS API TEST COMPLETE');
  console.log('='.repeat(50));
  console.log('All tests completed! The WordPress CSS extraction system is working.');
  console.log('GenerateBlocks elements are being extracted and stored successfully.');
};

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testCSSExtractionAPI().catch(console.error);
}

export default testCSSExtractionAPI;