#!/usr/bin/env node

/**
 * Import scheduled posts directly from WordPress API
 * These are finished, edited posts ready for publication
 */

const BASE_URL = 'http://localhost:8787';
const WORDPRESS_API = 'https://cruisemadeeasy.com/wp-json/wp/v2/posts';

// WordPress credentials
const WP_CREDENTIALS = {
  username: "support-team",
  password: "TMIi 8E5g NPxn 9B7F y4T0 L86q"
};

const authHeader = 'Basic ' + Buffer.from(`${WP_CREDENTIALS.username}:${WP_CREDENTIALS.password}`).toString('base64');

async function importScheduledPosts() {
  console.log('📅 Importing Finished Scheduled Posts from WordPress');
  console.log('===============================================');
  
  const AUTH_COOKIE = process.env.AUTH_COOKIE || '';
  
  if (!AUTH_COOKIE) {
    console.error('❌ AUTH_COOKIE environment variable is required');
    console.error('Set it like: AUTH_COOKIE="auth_token=your_token_here" node import-wp-scheduled.js');
    process.exit(1);
  }
  
  try {
    console.log('🔍 Step 1: Fetching scheduled post IDs from WordPress API...');
    
    // First, get just the basic post info and IDs
    const wpListUrl = `${WORDPRESS_API}?per_page=100&status=future&after=2025-09-28T00:00:00&before=2025-10-13T00:00:00&fields=id,title,date,slug,status`;
    console.log('List API URL:', wpListUrl);
    
    const wpListResponse = await fetch(wpListUrl, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    
    if (!wpListResponse.ok) {
      throw new Error(`WordPress API list failed: ${wpListResponse.status}`);
    }
    
    const wpPostsList = await wpListResponse.json();
    console.log(`📋 Found ${wpPostsList.length} scheduled posts in date range`);
    
    if (wpPostsList.length === 0) {
      console.log('✅ No scheduled posts found in target date range');
      return;
    }
    
    // Show what we found
    console.log('\n🔍 Posts found:');
    wpPostsList.forEach((post, index) => {
      console.log(`${index + 1}. ID: ${post.id} - ${post.title.rendered}`);
      console.log(`   Date: ${post.date}`);
      console.log(`   Status: ${post.status}`);
      console.log('');
    });
    
    console.log('\n🔍 Step 2: Fetching full post data by ID...');
    
    const wpPosts = [];
    for (const basicPost of wpPostsList) {
      try {
        console.log(`   Fetching full data for ID ${basicPost.id}...`);
        
        // Get full post data including content, categories, featured media
        const fullPostUrl = `${WORDPRESS_API}/${basicPost.id}?_embed=1`;
        const fullPostResponse = await fetch(fullPostUrl, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
        
        if (fullPostResponse.ok) {
          const fullPost = await fullPostResponse.json();
          wpPosts.push(fullPost);
          console.log(`   ✅ Got full data for "${fullPost.title.rendered}"`);
        } else {
          console.log(`   ❌ Failed to get full data for ID ${basicPost.id}: ${fullPostResponse.status}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`   ❌ Error fetching post ${basicPost.id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Retrieved full data for ${wpPosts.length} posts`);
    console.log(`📋 Found ${wpPosts.length} scheduled posts in date range`);
    
    if (wpPosts.length === 0) {
      console.log('✅ No scheduled posts found in target date range');
      return;
    }
    
    // Show what we found
    console.log('\n🔍 Posts to import:');
    wpPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.rendered}`);
      console.log(`   Date: ${post.date}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Categories: ${post.categories.join(', ')}`);
      console.log('');
    });
    
    console.log('🚀 Importing posts directly from WordPress API data...');
    
    let imported = 0;
    let skipped = 0;
    const errors = [];
    
    for (const wpPost of wpPosts) {
      try {
        console.log(`\n📝 Processing: ${wpPost.title.rendered}`);
        
        // Convert WordPress post to our format
        const importData = {
          title: wpPost.title.rendered,
          content: wpPost.content.rendered,
          excerpt: wpPost.excerpt?.rendered || '',
          slug: wpPost.slug,
          status: 'scheduled', // Keep as scheduled
          scheduled_date: wpPost.date,
          author_name: 'WordPress Import',
          featured_image_url: wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          category: getCategoryFromWP(wpPost),
          post_type: getPostTypeFromDate(wpPost.date)
        };
        
        // Check if already exists
        const checkResponse = await fetch(`${BASE_URL}/api/create/posts?limit=1000`, {
          headers: { 'Cookie': AUTH_COOKIE }
        });
        
        if (checkResponse.ok) {
          const existingPosts = await checkResponse.json();
          const existingPost = existingPosts.data.find(post => post.slug === importData.slug);
          
          if (existingPost) {
            console.log(`   ⏭️  Already exists (ID: ${existingPost.id}) - skipping`);
            skipped++;
            continue;
          }
        }
        
        // Import the post using our create API
        const importResponse = await fetch(`${BASE_URL}/api/create/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': AUTH_COOKIE
          },
          body: JSON.stringify(importData)
        });
        
        if (importResponse.ok) {
          const result = await importResponse.json();
          console.log(`   ✅ Imported successfully (ID: ${result.data.id})`);
          imported++;
        } else {
          const errorText = await importResponse.text();
          const errorMsg = `Failed to import: ${importResponse.status} - ${errorText}`;
          console.log(`   ❌ ${errorMsg}`);
          errors.push(`${wpPost.title.rendered}: ${errorMsg}`);
        }
        
        // Small delay between imports
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        const errorMsg = `Error processing ${wpPost.title.rendered}: ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log('\n🎉 WordPress scheduled posts import complete!');
    console.log('='.repeat(50));
    console.log(`📊 Results:`);
    console.log(`   Posts found: ${wpPosts.length}`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Helper functions
function getCategoryFromWP(wpPost) {
  // Map WordPress categories to our system
  if (wpPost._embedded && wpPost._embedded['wp:term']) {
    const categories = wpPost._embedded['wp:term'][0] || [];
    if (categories.length > 0) {
      const categoryName = categories[0].slug;
      // Map to our category system
      if (categoryName.includes('planning') || categoryName.includes('tips')) {
        return 'cruise-planning-tips';
      }
      if (categoryName.includes('review') || categoryName.includes('experience')) {
        return 'cruise-reviews';
      }
      return 'cruise-planning-tips'; // Default
    }
  }
  return 'cruise-planning-tips';
}

function getPostTypeFromDate(dateString) {
  const date = new Date(dateString);
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  
  switch (dayOfWeek) {
    case 1: return 'monday';     // Monday
    case 3: return 'wednesday';  // Wednesday  
    case 5: return 'friday';     // Friday
    case 6: return 'saturday';   // Saturday
    case 0: return 'newsletter'; // Sunday
    default: return 'monday';
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importScheduledPosts().catch(console.error);
}

export default importScheduledPosts;