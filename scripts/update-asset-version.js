#!/usr/bin/env node

/**
 * Update ASSET_VERSION in index.ts with current timestamp
 * Automatically generates cache-busting version on every build
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INDEX_TS_PATH = join(__dirname, '../src/worker/index.ts');

// Generate timestamp version: YYYYMMDD-HHMMSS
const now = new Date();
const timestamp = now.toISOString()
  .replace(/[-:]/g, '')
  .replace('T', '-')
  .slice(0, 15); // YYYYMMDD-HHMMSS

console.log(`🔄 Updating ASSET_VERSION to: ${timestamp}`);

try {
  // Read current file
  const content = readFileSync(INDEX_TS_PATH, 'utf-8');

  // Replace ASSET_VERSION value
  const updated = content.replace(
    /const ASSET_VERSION = "[^"]+";/,
    `const ASSET_VERSION = "${timestamp}";`
  );

  // Write back
  writeFileSync(INDEX_TS_PATH, updated, 'utf-8');

  console.log(`✅ ASSET_VERSION updated successfully in src/worker/index.ts`);
} catch (error) {
  console.error('❌ Failed to update ASSET_VERSION:', error.message);
  process.exit(1);
}
