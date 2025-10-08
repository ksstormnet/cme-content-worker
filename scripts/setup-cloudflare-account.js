#!/usr/bin/env node

/**
 * Setup script to automatically set the correct Cloudflare account
 * for the Cruise Made Easy project after MCP authentication
 */

console.log('🔧 Setting up Cloudflare account for Cruise Made Easy...');

// Sky + Sea, LLC account ID
const CRUISE_MADE_EASY_ACCOUNT_ID = '54919652c0ba9b83cb0ae04cb5ea90f3';

// This script would ideally call the MCP server directly, but since we're in a Node.js context
// and MCP servers run in Claude Code context, we output instructions for manual setup
console.log(`
✅ Cloudflare Account Setup Instructions:

1. After MCP authentication, run this command in Claude Code:
   mcp__cloudflare-radar__set_active_account with activeAccountIdParam: "${CRUISE_MADE_EASY_ACCOUNT_ID}"

2. This sets the active account to: Sky + Sea, LLC

3. All Cloudflare operations will use the correct account for:
   - D1 Database operations
   - R2 Storage operations  
   - Worker deployments
   - Analytics and debugging

Account ID: ${CRUISE_MADE_EASY_ACCOUNT_ID}
Account Name: Sky + Sea, LLC
`);

console.log('🎯 Setup complete! Use the Sky + Sea, LLC account for all Cloudflare operations.');