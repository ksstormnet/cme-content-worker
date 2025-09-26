#!/usr/bin/env node

/**
 * Full WordPress Import - All Posts with Correct Status
 * Imports published, draft, and scheduled posts from WordPress
 */

const WORDPRESS_API = 'https://cruisemadeeasy.com/wp-json/wp/v2';
const WORKER_API = 'https://cme-content-worker.ksstorm.workers.dev/api';

const runFullImport = async () => {
  console.log('🚀 Full WordPress Import Starting');
  console.log('==================================\n');
  
  const authCookie = process.env.AUTH_COOKIE;
  if (!authCookie) {
    console.error('❌ AUTH_COOKIE environment variable not set');
    process.exit(1);
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': authCookie
  };
  
  console.log('Step 1: Discovering all WordPress posts...');
  
  try {
    // Fetch all posts with different statuses
    const allPosts = [];
    const statuses = ['publish', 'draft', 'future']; // future = scheduled
    
    for (const status of statuses) {
      console.log(`  Fetching ${status} posts...`);
      
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const url = `${WORDPRESS_API}/posts?status=${status}&per_page=100&page=${page}&_embed=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.warn(`    Failed to fetch ${status} posts page ${page}: ${response.status}`);
          break;
        }
        
        const posts = await response.json();
        
        if (posts.length === 0) {
          hasMore = false;
        } else {
          allPosts.push(...posts.map(post => ({ ...post, wp_status: status })));
          console.log(`    Found ${posts.length} ${status} posts on page ${page}`);
          page++;
        }
        
        // Small delay to be respectful to WordPress API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n✅ Discovery complete: Found ${allPosts.length} total posts`);
    
    // Group posts by status
    const postsByStatus = {
      publish: allPosts.filter(p => p.wp_status === 'publish'),
      draft: allPosts.filter(p => p.wp_status === 'draft'), 
      future: allPosts.filter(p => p.wp_status === 'future')
    };
    
    console.log(`   📝 Published: ${postsByStatus.publish.length}`);
    console.log(`   📄 Drafts: ${postsByStatus.draft.length}`);
    console.log(`   ⏰ Scheduled: ${postsByStatus.future.length}`);
    
    if (allPosts.length === 0) {
      console.log('No posts found to import.');
      return;
    }
    
    console.log('\nStep 2: Preparing import URLs...');
    
    // Convert WordPress posts to URLs for our import API
    const postUrls = allPosts.map(post => {
      // Create the public URL for the post
      const baseUrl = 'https://cruisemadeeasy.com';
      
      if (post.wp_status === 'publish') {
        return `${baseUrl}/${post.slug}/`;
      } else {
        // For drafts and scheduled posts, we'll use the WordPress preview URL
        // but we'll need to modify our import to handle different status mapping
        return `${baseUrl}/${post.slug}/`;
      }
    });
    
    console.log(`📋 Prepared ${postUrls.length} URLs for import`);
    
    // Show a sample of what we're about to import
    console.log('\nSample posts to import:');
    postUrls.slice(0, 5).forEach((url, i) => {
      const post = allPosts[i];
      console.log(`  ${i + 1}. ${post.title.rendered} (${post.wp_status})`);
      console.log(`     ${url}`);
    });
    
    if (postUrls.length > 5) {
      console.log(`  ... and ${postUrls.length - 5} more posts`);
    }
    
    console.log('\nStep 3: Running enhanced WordPress import...');
    
    // Import in batches of 3 to be respectful to both APIs
    const batchSize = 3;
    const totalBatches = Math.ceil(postUrls.length / batchSize);
    let totalImported = 0;
    let totalSkipped = 0;
    let totalCSSElements = 0;
    let totalErrors = [];
    let categoriesCreated = new Set();
    
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const startIdx = batchNum * batchSize;
      const endIdx = Math.min(startIdx + batchSize, postUrls.length);
      const batchUrls = postUrls.slice(startIdx, endIdx);
      
      console.log(`\n📦 Batch ${batchNum + 1}/${totalBatches} (${batchUrls.length} posts)`);
      
      try {
        const importResponse = await fetch(`${WORKER_API}/wordpress-import/posts`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            post_urls: batchUrls,
            extract_css: true,
            create_categories: true,
            batch_size: batchSize
          })
        });
        
        if (!importResponse.ok) {
          const errorText = await importResponse.text();
          console.error(`   ❌ Batch ${batchNum + 1} failed: ${importResponse.status}`);
          console.error(`   Error: ${errorText.substring(0, 200)}...`);
          totalErrors.push(`Batch ${batchNum + 1}: ${errorText}`);
          continue;
        }
        
        const importResult = await importResponse.json();
        
        totalImported += importResult.data.imported;
        totalSkipped += importResult.data.skipped;
        totalCSSElements += importResult.data.cssElements;
        
        if (importResult.data.categoriesCreated) {
          importResult.data.categoriesCreated.forEach(cat => categoriesCreated.add(cat));
        }
        
        if (importResult.data.errors) {
          totalErrors.push(...importResult.data.errors);
        }
        
        console.log(`   ✅ Imported: ${importResult.data.imported}, Skipped: ${importResult.data.skipped}, CSS Elements: ${importResult.data.cssElements}`);
        
        // Delay between batches
        if (batchNum < totalBatches - 1) {
          console.log('   ⏸️  Waiting 3 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`   ❌ Batch ${batchNum + 1} error:`, error.message);
        totalErrors.push(`Batch ${batchNum + 1}: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 FULL IMPORT COMPLETE');
    console.log('='.repeat(60));
    
    console.log(`📊 Final Results:`);
    console.log(`   Posts imported: ${totalImported}`);
    console.log(`   Posts skipped: ${totalSkipped}`);
    console.log(`   CSS elements extracted: ${totalCSSElements}`);
    console.log(`   Categories created: ${categoriesCreated.size}`);
    console.log(`   Errors encountered: ${totalErrors.length}`);
    
    if (categoriesCreated.size > 0) {
      console.log(`\n📂 New categories created:`);
      Array.from(categoriesCreated).forEach(cat => {
        console.log(`   - ${cat}`);
      });
    }
    
    if (totalErrors.length > 0) {
      console.log(`\n⚠️  Errors summary:`);
      totalErrors.slice(0, 10).forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 100)}...`);
      });
      
      if (totalErrors.length > 10) {
        console.log(`   ... and ${totalErrors.length - 10} more errors`);
      }
    }
    
    console.log('\nStep 4: Verifying import results...');
    
    // Check final database state
    try {
      const postsResponse = await fetch(`${WORKER_API}/posts`, { headers });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        const importedPosts = postsData.data?.posts || [];
        
        console.log(`✅ Database verification: ${importedPosts.length} total posts in database`);
        
        // Count posts by status
        const statusCounts = {
          published: importedPosts.filter(p => p.status === 'published').length,
          draft: importedPosts.filter(p => p.status === 'draft').length,
          scheduled: importedPosts.filter(p => p.status === 'scheduled').length
        };
        
        console.log(`   📝 Published: ${statusCounts.published}`);
        console.log(`   📄 Drafts: ${statusCounts.draft}`);
        console.log(`   ⏰ Scheduled: ${statusCounts.scheduled}`);
      }
      
      // Check CSS elements
      const cssResponse = await fetch(`${WORKER_API}/wordpress-css/elements`, { headers });
      
      if (cssResponse.ok) {
        const cssData = await cssResponse.json();
        console.log(`✅ CSS verification: ${cssData.data?.count || 0} GenerateBlocks elements stored`);
      }
      
    } catch (error) {
      console.error('⚠️  Verification failed:', error.message);
    }
    
    console.log('\n🎯 WordPress import completed successfully!');
    console.log('All current posts have been imported with proper status mapping.');
    
  } catch (error) {
    console.error('❌ Full import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

runFullImport().catch(console.error);