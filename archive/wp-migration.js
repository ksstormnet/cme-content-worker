#!/usr/bin/env node

/**
 * WordPress to CME Content Worker Migration Script
 * Pulls all posts and media from cruisemadeeasy.com WordPress REST API
 * Converts posts to content blocks and uploads images to R2
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  wpSiteUrl: 'https://cruisemadeeasy.com',
  wpApiBase: 'https://cruisemadeeasy.com/wp-json/wp/v2',
  workerApiBase: 'http://localhost:8787/api',
  r2BucketName: 'cruisemadeeasy-images',
  r2PublicUrl: 'https://cdn.cruisemadeeasy.com',
  batchSize: 50,
  requestDelay: 1000, // 1 second delay between requests
  maxRetries: 3,
  outputDir: './migration-data',
  logFile: './migration-log.json'
};

// Migration state and logs
let migrationLog = {
  startTime: new Date().toISOString(),
  posts: {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    errors: []
  },
  media: {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    errors: []
  },
  endTime: null,
  summary: {}
};

/**
 * Utility functions
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
};

const saveLog = async () => {
  try {
    await fs.writeFile(CONFIG.logFile, JSON.stringify(migrationLog, null, 2));
  } catch (error) {
    log(`Failed to save log: ${error.message}`, 'error');
  }
};

/**
 * WordPress API functions
 */
const fetchWithRetry = async (url, options = {}, retryCount = 0) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'CME-Migration-Script/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (retryCount < CONFIG.maxRetries) {
      log(`Retrying request to ${url} (attempt ${retryCount + 1}/${CONFIG.maxRetries})`, 'warn');
      await delay(CONFIG.requestDelay * (retryCount + 1));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
};

const getAllPosts = async () => {
  log('Starting to fetch all WordPress posts...');
  let allPosts = [];
  let page = 1;
  let totalPages = 1;
  
  do {
    try {
      const url = `${CONFIG.wpApiBase}/posts?per_page=${CONFIG.batchSize}&page=${page}&_embed=1`;
      log(`Fetching posts page ${page}/${totalPages}`);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'CME-Migration-Script/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const posts = await response.json();
      totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      
      allPosts = allPosts.concat(posts);
      log(`Fetched ${posts.length} posts from page ${page}`);
      
      page++;
      await delay(CONFIG.requestDelay);
    } catch (error) {
      log(`Error fetching posts page ${page}: ${error.message}`, 'error');
      break;
    }
  } while (page <= totalPages);
  
  migrationLog.posts.total = allPosts.length;
  log(`Total posts fetched: ${allPosts.length}`);
  return allPosts;
};

const getAllMediaFromPosts = async (posts) => {
  log('Extracting all media from embedded post data...');
  const allMedia = new Map(); // Use Map to avoid duplicates
  
  for (const post of posts) {
    // Extract featured media
    const featuredMedia = post._embedded?.['wp:featuredmedia'];
    if (featuredMedia && featuredMedia.length > 0) {
      const media = featuredMedia[0];
      allMedia.set(media.id, media);
    }
    
    // Extract media from post content (images referenced in content)
    const contentImages = post.content.rendered.match(/<img[^>]+src="([^">]+)"/g);
    if (contentImages) {
      for (const imgTag of contentImages) {
        const srcMatch = imgTag.match(/src="([^">]+)"/);
        if (srcMatch) {
          const imageUrl = srcMatch[1];
          // Try to extract media ID from WordPress URLs
          const wpImageMatch = imageUrl.match(/wp-content\/uploads\/(\d{4})\/(\d{2})\/(.+?)(?:-\d+x\d+)?\.(\w+)/);
          if (wpImageMatch) {
            // Create a pseudo-media object for content images
            const [, year, month, filename, extension] = wpImageMatch;
            const pseudoId = `content-${filename}`;
            if (!allMedia.has(pseudoId)) {
              allMedia.set(pseudoId, {
                id: pseudoId,
                source_url: imageUrl.replace(/-\d+x\d+\.(\w+)$/, '.$1'), // Get full size
                title: { rendered: filename },
                alt_text: '',
                caption: { rendered: '' },
                description: { rendered: '' },
                mime_type: `image/${extension}`,
                slug: filename
              });
            }
          }
        }
      }
    }
  }
  
  const mediaArray = Array.from(allMedia.values());
  migrationLog.media.total = mediaArray.length;
  log(`Total media items extracted: ${mediaArray.length}`);
  return mediaArray;
};

/**
 * Content conversion functions
 */
const htmlToContentBlocks = (htmlContent) => {
  // Simple HTML to content blocks conversion
  // This is a basic implementation - you may want to enhance it
  const blocks = [];
  let blockOrder = 0;
  
  // Split content by paragraphs and headings
  const sections = htmlContent
    .replace(/\n\n+/g, '\n\n')
    .split(/(?=<h[1-6]|<p|<ul|<ol|<blockquote)/i)
    .filter(section => section.trim());
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    if (trimmed.match(/^<h([1-6])/i)) {
      const level = trimmed.match(/^<h([1-6])/i)[1];
      const text = trimmed.replace(/<\/?h[1-6][^>]*>/gi, '').trim();
      blocks.push({
        block_type: 'heading',
        block_order: blockOrder++,
        content: JSON.stringify({
          level: parseInt(level),
          text: text
        })
      });
    } else if (trimmed.match(/^<p/i)) {
      const text = trimmed.replace(/<\/?p[^>]*>/gi, '').trim();
      if (text) {
        blocks.push({
          block_type: 'paragraph',
          block_order: blockOrder++,
          content: JSON.stringify({
            text: text
          })
        });
      }
    } else if (trimmed.match(/^<(ul|ol)/i)) {
      const listType = trimmed.match(/^<(ul|ol)/i)[1];
      blocks.push({
        block_type: 'list',
        block_order: blockOrder++,
        content: JSON.stringify({
          type: listType === 'ul' ? 'unordered' : 'ordered',
          items: trimmed.match(/<li[^>]*>(.*?)<\/li>/gi)?.map(li => 
            li.replace(/<\/?li[^>]*>/gi, '').trim()
          ) || []
        })
      });
    } else if (trimmed.match(/^<blockquote/i)) {
      const text = trimmed.replace(/<\/?blockquote[^>]*>/gi, '').trim();
      blocks.push({
        block_type: 'quote',
        block_order: blockOrder++,
        content: JSON.stringify({
          text: text,
          attribution: ''
        })
      });
    }
  }
  
  // If no blocks were created, create a single paragraph with all content
  if (blocks.length === 0 && htmlContent.trim()) {
    blocks.push({
      block_type: 'paragraph',
      block_order: 0,
      content: JSON.stringify({
        text: htmlContent.replace(/<[^>]*>/g, '').trim()
      })
    });
  }
  
  return blocks;
};

const convertWpPost = (wpPost) => {
  // Convert HTML content to plain text for the import API
  const plainTextContent = wpPost.content.rendered.replace(/<[^>]*>/g, '').trim();
  
  // Extract categories and tags from embedded data
  const wpTerms = wpPost._embedded?.['wp:term'] || [];
  const categories = wpTerms[0] || []; // Categories are typically index 0
  const tags = wpTerms[1] || [];       // Tags are typically index 1
  
  // Get primary category (use first category or default)
  const primaryCategory = categories[0]?.name?.toLowerCase() || 'general';
  
  // Extract all tag names
  const tagNames = tags.map(tag => tag.name).filter(Boolean);
  
  return {
    slug: wpPost.slug,
    title: wpPost.title.rendered,
    content: plainTextContent, // Plain text for import API
    excerpt: wpPost.excerpt.rendered.replace(/<[^>]*>/g, '').trim(),
    status: wpPost.status === 'publish' ? 'published' : wpPost.status,
    post_type: 'monday', // Default - you may want to categorize based on post content
    persona: null, // Default - you may want to assign based on content analysis
    featured_image_url: wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
    meta_title: wpPost.title.rendered,
    meta_description: wpPost.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160).trim(),
    keywords: JSON.stringify(tagNames), // Use tags as keywords for SEO
    category: primaryCategory, // Use primary WordPress category
    tags: JSON.stringify(tagNames), // All WordPress tags
    wp_categories: JSON.stringify(categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug
    }))), // Preserve original WordPress categories
    wp_tags: JSON.stringify(tags.map(tag => ({
      id: tag.id, 
      name: tag.name,
      slug: tag.slug
    }))), // Preserve original WordPress tags
    published_date: wpPost.date,
    created_at: wpPost.date,
    updated_at: wpPost.modified,
    author_id: 1 // Default admin user
  };
};

/**
 * Database insertion functions
 */
const insertPostToDb = async (post) => {
  try {
    // Convert to the format expected by the import API
    const articleData = {
      title: post.title,
      content: post.content,
      post_type: post.post_type,
      publish_date: post.published_date || post.created_at,
      week_start_date: post.created_at.split('T')[0],
      seo_keywords: JSON.parse(post.keywords || '[]')
    };
    
    const response = await fetch(`${CONFIG.workerApiBase}/import/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.AUTH_COOKIE || ''
      },
      body: JSON.stringify({
        articles_data: [articleData]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to insert post: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    log(`Error inserting post ${post.slug}: ${error.message}`, 'error');
    throw error;
  }
};

const downloadAndUploadImage = async (mediaItem) => {
  try {
    const imageUrl = mediaItem.source_url || mediaItem.guid?.rendered;
    if (!imageUrl) {
      throw new Error('No image URL found');
    }
    
    // Download image
    log(`Downloading image: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl, {
      headers: { 'User-Agent': 'CME-Migration-Script/1.0' }
    });
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const fileName = path.basename(imageUrl.split('?')[0]);
    
    // Extract year/month from WordPress URL structure
    // URL pattern: https://cruisemadeeasy.com/wp-content/uploads/YEAR/MONTH/filename.ext
    const urlMatch = imageUrl.match(/\/wp-content\/uploads\/(\d{4})\/(\d{2})\//);
    const year = urlMatch ? urlMatch[1] : new Date().getFullYear().toString();
    const month = urlMatch ? urlMatch[2] : String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Keep the exact original filename from WordPress
    const originalFileName = fileName;
    
    // Upload to R2 via Worker API with proper directory structure
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { 
      type: mediaItem.mime_type || 'image/jpeg' 
    });
    formData.append('file', blob, originalFileName);
    formData.append('path', `${year}/${month}/`); // Exact WordPress structure: YEAR/MONTH/
    formData.append('title', mediaItem.title?.rendered || '');
    formData.append('alt_text', mediaItem.alt_text || '');
    formData.append('caption', mediaItem.caption?.rendered || '');
    formData.append('description', mediaItem.description?.rendered || '');
    
    const uploadResponse = await fetch(`${CONFIG.workerApiBase}/media/upload`, {
      method: 'POST',
      headers: {
        'Cookie': process.env.AUTH_COOKIE || ''
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    log(`Successfully uploaded image: ${year}/${month}/${originalFileName}`);
    return uploadResult;
    
  } catch (error) {
    log(`Error processing image ${mediaItem.id}: ${error.message}`, 'error');
    throw error;
  }
};

/**
 * Main migration functions
 */
const migratePosts = async (posts) => {
  log(`Starting post migration: ${posts.length} posts to process`);
  
  for (const wpPost of posts) {
    try {
      migrationLog.posts.processed++;
      log(`Processing post ${migrationLog.posts.processed}/${migrationLog.posts.total}: ${wpPost.title.rendered}`);
      
      const convertedPost = convertWpPost(wpPost);
      await insertPostToDb(convertedPost);
      
      migrationLog.posts.success++;
      log(`Successfully migrated post: ${wpPost.slug}`);
      
    } catch (error) {
      migrationLog.posts.failed++;
      migrationLog.posts.errors.push({
        post_id: wpPost.id,
        slug: wpPost.slug,
        title: wpPost.title.rendered,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      log(`Failed to migrate post ${wpPost.slug}: ${error.message}`, 'error');
    }
    
    await delay(CONFIG.requestDelay);
    await saveLog();
  }
};

const migrateMedia = async (mediaItems) => {
  log(`Starting media migration: ${mediaItems.length} items to process`);
  
  for (const mediaItem of mediaItems) {
    try {
      migrationLog.media.processed++;
      log(`Processing media ${migrationLog.media.processed}/${migrationLog.media.total}: ${mediaItem.id}`);
      
      await downloadAndUploadImage(mediaItem);
      
      migrationLog.media.success++;
      log(`Successfully migrated media: ${mediaItem.id}`);
      
    } catch (error) {
      migrationLog.media.failed++;
      migrationLog.media.errors.push({
        media_id: mediaItem.id,
        slug: mediaItem.slug,
        url: mediaItem.source_url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      log(`Failed to migrate media ${mediaItem.id}: ${error.message}`, 'error');
    }
    
    await delay(CONFIG.requestDelay * 2); // Longer delay for image processing
    await saveLog();
  }
};

/**
 * Main migration orchestrator
 */
const runMigration = async () => {
  try {
    log('Starting WordPress to CME Content Worker migration...');
    
    // Create output directory
    try {
      await fs.mkdir(CONFIG.outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Fetch all posts from WordPress (with embedded media)
    const posts = await getAllPosts();
    
    // Extract all media from the posts
    const media = await getAllMediaFromPosts(posts);
    
    // Save raw data for backup
    await fs.writeFile(
      path.join(CONFIG.outputDir, 'wp-posts.json'),
      JSON.stringify(posts, null, 2)
    );
    await fs.writeFile(
      path.join(CONFIG.outputDir, 'wp-media.json'),
      JSON.stringify(media, null, 2)
    );
    
    log(`Backup data saved to ${CONFIG.outputDir}`);
    
    // Run migrations
    await migratePosts(posts);
    await migrateMedia(media);
    
    // Final summary
    migrationLog.endTime = new Date().toISOString();
    migrationLog.summary = {
      total_duration: new Date(migrationLog.endTime) - new Date(migrationLog.startTime),
      posts_success_rate: (migrationLog.posts.success / migrationLog.posts.total * 100).toFixed(2) + '%',
      media_success_rate: (migrationLog.media.success / migrationLog.media.total * 100).toFixed(2) + '%',
      total_errors: migrationLog.posts.errors.length + migrationLog.media.errors.length
    };
    
    await saveLog();
    
    log('='.repeat(60));
    log('MIGRATION COMPLETE');
    log('='.repeat(60));
    log(`Posts: ${migrationLog.posts.success}/${migrationLog.posts.total} successful`);
    log(`Media: ${migrationLog.media.success}/${migrationLog.media.total} successful`);
    log(`Duration: ${Math.round(migrationLog.summary.total_duration / 1000)} seconds`);
    log(`Log saved to: ${CONFIG.logFile}`);
    log('='.repeat(60));
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Check if AUTH_COOKIE is set
if (!process.env.AUTH_COOKIE) {
  console.error(`
ERROR: AUTH_COOKIE environment variable is required.

Please set it to your authentication cookie from the CME Worker:
export AUTH_COOKIE="auth_token=your_token_here"

Then run the migration again.
`);
  process.exit(1);
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export {
  runMigration,
  getAllPosts,
  getAllMediaFromPosts,
  convertWpPost,
  htmlToContentBlocks
};