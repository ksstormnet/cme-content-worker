#!/usr/bin/env node

/**
 * Test script for WordPress import functionality
 * Tests connection to WordPress API and Worker API
 */

const CONFIG = {
  wpApiBase: 'https://cruisemadeeasy.com/wp-json/wp/v2',
  workerApiBase: 'http://localhost:8787/api'
};

const testWordPressApi = async () => {
  console.log('Testing WordPress API connection...');
  
  try {
    // Test posts endpoint with embedded data
    const postsResponse = await fetch(`${CONFIG.wpApiBase}/posts?per_page=1&_embed=1`);
    if (!postsResponse.ok) {
      throw new Error(`Posts API failed: ${postsResponse.statusText}`);
    }
    const posts = await postsResponse.json();
    console.log(`✓ WordPress Posts API working - found ${posts.length} posts`);
    console.log(`  Sample post: ${posts[0]?.title?.rendered || 'No title'}`);
    
    // Test media from embedded post data
    const embeddedPost = posts[0];
    const featuredMedia = embeddedPost._embedded?.['wp:featuredmedia'];
    const hasMedia = featuredMedia && featuredMedia.length > 0;
    console.log(`✓ WordPress Media (embedded) - found ${hasMedia ? featuredMedia.length : 0} media items`);
    if (hasMedia) {
      const media = featuredMedia[0];
      console.log(`  Sample media: ${media.title?.rendered || 'No title'} (${media.source_url})`);
      console.log(`  Directory structure: ${media.source_url.match(/\/(\d{4})\/(\d{2})\//)?.[0] || 'No pattern'}`);
    }
    
    return true;
  } catch (error) {
    console.error(`✗ WordPress API test failed: ${error.message}`);
    return false;
  }
};

const testWorkerApi = async () => {
  console.log('Testing Worker API connection...');
  
  if (!process.env.AUTH_COOKIE) {
    console.error('✗ AUTH_COOKIE environment variable not set');
    return false;
  }
  
  try {
    // Test auth endpoint
    const authResponse = await fetch(`${CONFIG.workerApiBase}/auth/me`, {
      headers: {
        'Cookie': process.env.AUTH_COOKIE
      }
    });
    
    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.statusText}`);
    }
    
    const authData = await authResponse.json();
    console.log(`✓ Worker API authentication working`);
    console.log(`  Authenticated as: ${authData.user?.email || 'Unknown'} (${authData.user?.role || 'No role'})`);
    
    return true;
  } catch (error) {
    console.error(`✗ Worker API test failed: ${error.message}`);
    return false;
  }
};

const testImageUpload = async () => {
  console.log('Testing image upload functionality...');
  
  try {
    // Download a small test image from your WordPress site
    const testImageUrl = 'https://cruisemadeeasy.com/wp-content/uploads/2025/08/hubbard-glacier.jpg';
    console.log(`Downloading test image: ${testImageUrl}`);
    
    const imageResponse = await fetch(testImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download test image: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`✓ Downloaded test image (${imageBuffer.byteLength} bytes)`);
    
    // Test upload to Worker with WordPress-style directory structure
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'hubbard-glacier.jpg'); // Keep original filename
    formData.append('path', '2025/08/'); // WordPress pattern: YEAR/MONTH/
    formData.append('alt_text', 'Test migration image');
    
    const uploadResponse = await fetch(`${CONFIG.workerApiBase}/media/upload`, {
      method: 'POST',
      headers: {
        'Cookie': process.env.AUTH_COOKIE
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log(`✓ Image upload successful`);
    console.log(`  Uploaded to: ${uploadResult.url || 'Unknown URL'}`);
    
    return true;
  } catch (error) {
    console.error(`✗ Image upload test failed: ${error.message}`);
    return false;
  }
};

const testPostCreation = async () => {
  console.log('Testing post import...');
  
  try {
    const testArticles = [
      {
        title: 'Test Migration Post',
        content: 'This is a test post created during the migration process.',
        post_type: 'monday',
        publish_date: new Date().toISOString(),
        week_start_date: new Date().toISOString().split('T')[0],
        seo_keywords: ['test', 'migration']
      }
    ];
    
    const response = await fetch(`${CONFIG.workerApiBase}/import/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.AUTH_COOKIE
      },
      body: JSON.stringify({
        articles_data: testArticles
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Post import failed (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✓ Post import successful`);
    console.log(`  Imported: ${result.data?.imported || 0} posts`);
    
    return true;
  } catch (error) {
    console.error(`✗ Post import test failed: ${error.message}`);
    return false;
  }
};

const runTests = async () => {
  console.log('Starting migration functionality tests...\n');
  
  const wpApiTest = await testWordPressApi();
  console.log();
  
  const workerApiTest = await testWorkerApi();
  console.log();
  
  let imageTest = false;
  let postTest = false;
  
  if (workerApiTest) {
    imageTest = await testImageUpload();
    console.log();
    
    postTest = await testPostCreation();
    console.log();
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`WordPress API: ${wpApiTest ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Worker API Auth: ${workerApiTest ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Image Upload: ${imageTest ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Post Creation: ${postTest ? '✓ PASS' : '✗ FAIL'}`);
  console.log('='.repeat(50));
  
  if (wpApiTest && workerApiTest && imageTest && postTest) {
    console.log('All tests passed! Ready to run full migration.');
    return true;
  } else {
    console.log('Some tests failed. Please fix issues before running full migration.');
    return false;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };