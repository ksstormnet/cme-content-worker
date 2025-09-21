#!/usr/bin/env node

/**
 * Complete WordPress Import Runner
 * Orchestrates the full migration process
 */

import { runTests } from './test-wp-import.js';
import { runMigration } from './wp-migration.js';
import { createInterface } from 'readline';

const runFullImport = async () => {
  console.log('CME Content Worker - WordPress Import Tool');
  console.log('==========================================\n');

  // Step 1: Run tests to ensure everything is working
  console.log('STEP 1: Running pre-migration tests...');
  const testsPass = await runTests();
  
  if (!testsPass) {
    console.error('\n❌ Tests failed. Please fix issues before proceeding with migration.');
    console.error('Check your worker server, authentication, and API endpoints.');
    process.exit(1);
  }

  console.log('\n✅ All tests passed! Proceeding with full migration...\n');
  
  // Step 2: Confirm migration
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const proceed = await new Promise(resolve => {
    readline.question('This will import ALL posts and images from cruisemadeeasy.com. Continue? (y/N): ', answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
  
  readline.close();
  
  if (!proceed) {
    console.log('Migration cancelled by user.');
    process.exit(0);
  }

  // Step 3: Run full migration
  console.log('\nStarting full WordPress migration...\n');
  await runMigration();
  
  console.log('\n🎉 Migration completed! Check migration-log.json for details.');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.AUTH_COOKIE) {
    console.error(`
❌ ERROR: AUTH_COOKIE environment variable is required.

You need to authenticate with your CME Worker first. Run this command:

export AUTH_COOKIE="auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGNydWlzZW1hZGVlYXN5LmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc1ODQ2MDg5MH0.czIYqBbKiViX9EWD5_fBiTcA8drDt6yhswWVjPSIGyY"

Then run this script again:
node wordpress-import.js
`);
    process.exit(1);
  }

  runFullImport().catch(error => {
    console.error('Migration failed:', error.message);
    process.exit(1);
  });
}