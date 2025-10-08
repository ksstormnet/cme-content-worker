#!/usr/bin/env node
/**
 * Import script - Re-import exported data to remote D1 with schema transformation
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const EXPORT_DIR = './archive/database-export-20251008-025736';

// Execute D1 command with proper escaping
function executeD1(sql) {
  const escapedSql = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmd = `npx wrangler d1 execute cme-content-db --remote --command="${escapedSql}"`;
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { success: true, result };
  } catch (error) {
    console.error('❌ SQL Error:', error.stderr || error.message);
    return { success: false, error: error.message };
  }
}

// Load JSON export
function loadExport(table) {
  const data = JSON.parse(readFileSync(`${EXPORT_DIR}/${table}.json`, 'utf8'));
  return data[0]?.results || [];
}

// Import categories first (needed for category_id FK)
console.log('📁 Importing categories...');
const categories = loadExport('categories');
console.log(`Found ${categories.length} categories`);

// Create lookup map: category_id -> category.slug
const categoryMap = {};
for (const cat of categories) {
  categoryMap[cat.id] = cat.slug;

  const sql = `INSERT INTO categories (id, slug, name, description, priority, created_at, updated_at)
               VALUES (${cat.id}, '${cat.slug}', '${cat.name.replace(/'/g, "''")}',
                       ${cat.description ? `'${cat.description.replace(/'/g, "''")}'` : 'NULL'},
                       ${cat.priority || 'NULL'},
                       '${cat.created_at}', '${cat.updated_at}')`;

  const result = executeD1(sql);
  if (!result.success) {
    console.error(`Failed to import category ${cat.slug}`);
  }
}
console.log(`✅ Imported ${categories.length} categories`);

// Import users
console.log('\n👤 Importing users...');
const users = loadExport('users');
for (const user of users) {
  const sql = `INSERT INTO users (id, email, password_hash, name, role, active, last_login, created_at, updated_at)
               VALUES (${user.id}, '${user.email}', '${user.password_hash}',
                       '${user.name.replace(/'/g, "''")}', '${user.role}', ${user.active},
                       ${user.last_login ? `'${user.last_login}'` : 'NULL'},
                       '${user.created_at}', '${user.updated_at}')`;

  executeD1(sql);
}
console.log(`✅ Imported ${users.length} users`);

// Import posts (transform category_id -> category text)
console.log('\n📝 Importing posts...');
const posts = loadExport('posts');
let imported = 0;

for (const post of posts) {
  // Transform category_id to category slug
  const categorySlug = categoryMap[post.category_id] || 'general';

  const sql = `INSERT INTO posts
    (id, slug, title, content, excerpt, status, post_type, persona, author_id,
     featured_image_url, meta_title, meta_description, keywords, category, category_id,
     scheduled_date, published_date, created_at, updated_at, featured_image_id)
    VALUES (
      ${post.id},
      '${post.slug.replace(/'/g, "''")}',
      '${post.title.replace(/'/g, "''")}',
      '${post.content.replace(/'/g, "''")}',
      ${post.excerpt ? `'${post.excerpt.replace(/'/g, "''")}'` : 'NULL'},
      '${post.status}',
      '${post.post_type}',
      ${post.persona ? `'${post.persona}'` : 'NULL'},
      ${post.author_id || 'NULL'},
      ${post.featured_image_url ? `'${post.featured_image_url}'` : 'NULL'},
      ${post.meta_title ? `'${post.meta_title.replace(/'/g, "''")}'` : 'NULL'},
      ${post.meta_description ? `'${post.meta_description.replace(/'/g, "''")}'` : 'NULL'},
      ${post.keywords ? `'${post.keywords.replace(/'/g, "''")}'` : 'NULL'},
      '${categorySlug}',
      ${post.category_id},
      ${post.scheduled_date ? `'${post.scheduled_date}'` : 'NULL'},
      ${post.published_date ? `'${post.published_date}'` : 'NULL'},
      '${post.created_at}',
      '${post.updated_at}',
      ${post.featured_image_id ? `'${post.featured_image_id}'` : 'NULL'}
    )`;

  const result = executeD1(sql);
  if (result.success) {
    imported++;
  } else {
    console.error(`Failed to import post: ${post.slug}`);
  }
}
console.log(`✅ Imported ${imported}/${posts.length} posts`);

// Import content_blocks
console.log('\n📦 Importing content_blocks...');
const blocks = loadExport('content_blocks');
let blocksImported = 0;

for (const block of blocks) {
  const sql = `INSERT INTO content_blocks
    (id, post_id, block_type, content, block_order, created_at, updated_at)
    VALUES (
      ${block.id},
      ${block.post_id},
      '${block.block_type}',
      '${block.content.replace(/'/g, "''")}',
      ${block.block_order},
      '${block.created_at}',
      '${block.updated_at}'
    )`;

  const result = executeD1(sql);
  if (result.success) {
    blocksImported++;
  }
}
console.log(`✅ Imported ${blocksImported}/${blocks.length} content blocks`);

// Import remaining tables
const otherTables = [
  'tags', 'post_tags', 'settings', 'images', 'media_files',
  'media_categories', 'media_usage', 'content_plans', 'content_calendar',
  'weekly_content_plans', 'ai_generations'
];

for (const table of otherTables) {
  try {
    console.log(`\n📥 Importing ${table}...`);
    const rows = loadExport(table);
    console.log(`  Found ${rows.length} rows`);

    if (rows.length === 0) {
      console.log(`  ⏭️  Skipping empty table`);
      continue;
    }

    // Get column names from first row
    const columns = Object.keys(rows[0]);

    for (const row of rows) {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/'/g, "''")}'`;
      }).join(', ');

      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values})`;
      executeD1(sql);
    }

    console.log(`  ✅ Imported ${rows.length} rows`);
  } catch (error) {
    console.log(`  ⚠️  Skipped ${table}: ${error.message}`);
  }
}

console.log('\n🎉 Import complete!');
console.log('\n📊 Verification:');
executeD1('SELECT COUNT(*) as count FROM posts');
executeD1('SELECT COUNT(*) as count FROM content_blocks');
executeD1('SELECT COUNT(*) as count FROM categories');
