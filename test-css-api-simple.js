#!/usr/bin/env node

/**
 * Simple test of CSS extraction API against remote database
 */

const testCSSAPI = async () => {
  console.log('Testing CSS Extraction API with Remote Database');
  console.log('================================================\n');
  
  const authCookie = process.env.AUTH_COOKIE;
  if (!authCookie) {
    console.error('❌ AUTH_COOKIE environment variable not set');
    process.exit(1);
  }
  
  // Use the actual deployed worker URL instead of localhost
  const apiBase = 'https://cme-content-worker.ksstorm.workers.dev/api';
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': authCookie
  };
  
  console.log('Step 1: Testing CSS extraction...');
  try {
    const extractResponse = await fetch(`${apiBase}/wordpress-css/extract`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        urls: [
          'https://cruisemadeeasy.com/weekend-wanderlust-repositioning-routes-hidden-gems/'
        ]
      })
    });
    
    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error(`❌ CSS extraction failed: ${extractResponse.status}`);
      console.error(errorText.substring(0, 500));
      return;
    }
    
    const extractResult = await extractResponse.json();
    console.log('✅ CSS extraction successful:');
    console.log(`   Processed URLs: ${extractResult.data.processedUrls}`);
    console.log(`   Total Elements: ${extractResult.data.totalElements}`);
    
    if (extractResult.data.totalElements === 0) {
      console.warn('⚠️  No elements found - this might indicate an issue');
      return;
    }
    
  } catch (error) {
    console.error('❌ CSS extraction error:', error.message);
    return;
  }
  
  console.log('\nStep 2: Checking stored elements...');
  try {
    const elementsResponse = await fetch(`${apiBase}/wordpress-css/elements`, {
      headers: headers
    });
    
    if (!elementsResponse.ok) {
      console.error(`❌ Elements check failed: ${elementsResponse.status}`);
      return;
    }
    
    const elementsResult = await elementsResponse.json();
    console.log('✅ Elements stored successfully:');
    console.log(`   Elements count: ${elementsResult.data.count}`);
    
    if (elementsResult.data.count > 0) {
      const sampleElement = elementsResult.data.elements[0];
      console.log(`   Sample element: gb-element-${sampleElement.elementId}`);
      console.log(`   CSS length: ${sampleElement.styles?.length || 0} characters`);
    }
    
  } catch (error) {
    console.error('❌ Elements check error:', error.message);
    return;
  }
  
  console.log('\nStep 3: Testing consolidated CSS...');
  try {
    const consolidatedResponse = await fetch(`${apiBase}/wordpress-css/consolidated`, {
      headers: headers
    });
    
    if (!consolidatedResponse.ok) {
      console.error(`❌ Consolidated CSS failed: ${consolidatedResponse.status}`);
      return;
    }
    
    const consolidatedResult = await consolidatedResponse.json();
    console.log('✅ Consolidated CSS generated:');
    console.log(`   Elements: ${consolidatedResult.data.elementsCount}`);
    console.log(`   CSS size: ${consolidatedResult.data.consolidatedCSS.length} characters`);
    
    // Show a small preview
    const preview = consolidatedResult.data.consolidatedCSS.substring(0, 200);
    console.log(`   Preview: ${preview}...`);
    
  } catch (error) {
    console.error('❌ Consolidated CSS error:', error.message);
    return;
  }
  
  console.log('\n✅ CSS Extraction API test completed successfully!');
  console.log('The remote database now has GenerateBlocks elements stored.');
};

testCSSAPI().catch(console.error);