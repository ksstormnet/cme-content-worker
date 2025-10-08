#!/usr/bin/env node
/**
 * Batch import content blocks from export
 * Uses multi-row INSERT statements for better performance
 */

import { readFileSync, writeFileSync } from 'fs';

const EXPORT_DIR = './archive/database-export-20251008-025736';
const BATCH_SIZE = 100; // Insert 100 blocks per SQL statement

// Load content blocks export
const data = JSON.parse(readFileSync(`${EXPORT_DIR}/content_blocks.json`, 'utf8'));
const blocks = data[0]?.results || [];

console.log(`📦 Found ${blocks.length} content blocks to import`);

// Group blocks into batches
const batches = [];
for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
  batches.push(blocks.slice(i, i + BATCH_SIZE));
}

console.log(`📊 Split into ${batches.length} batches of ${BATCH_SIZE} blocks each`);

// Generate SQL file with batch inserts
const sqlStatements = [];

for (let batchNum = 0; batchNum < batches.length; batchNum++) {
  const batch = batches[batchNum];

  const values = batch.map(block => {
    const content = String(block.content || '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "''")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');

    return `(${block.id}, ${block.post_id}, '${block.block_type}', ${block.block_order}, '${content}', '${block.created_at}')`;
  }).join(',\n  ');

  const sql = `INSERT INTO content_blocks (id, post_id, block_type, block_order, content, created_at)
VALUES
  ${values};`;

  sqlStatements.push(sql);
}

// Write SQL file
const sqlFile = './scripts/import-content-blocks.sql';
writeFileSync(sqlFile, sqlStatements.join('\n\n'));

console.log(`✅ Generated SQL file: ${sqlFile}`);
console.log(`📝 Contains ${sqlStatements.length} batch INSERT statements`);
console.log(`\n🚀 To import, run:`);
console.log(`   npx wrangler d1 execute cme-content-db --remote --file=${sqlFile}`);
