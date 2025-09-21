/**
 * WordPress API Discovery Script
 * Session 1: WordPress REST API Discovery & Authentication
 * 
 * Discovers all WordPress REST API endpoints and validates access
 */

import { createWordPressAPI } from '../src/utils/wp-api.ts';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface DiscoveryResults {
  connection_test: any;
  endpoint_discovery: any;
  generate_endpoints: any;
  endpoint_validation: any;
  session_info: {
    timestamp: string;
    session: number;
    total_endpoints: number;
    accessible_endpoints: number;
    generate_specific: number;
  };
}

async function runAPIDiscovery() {
  console.log('🚀 Starting WordPress API Discovery...\n');

  try {
    // Initialize WordPress API client
    const api = await createWordPressAPI();
    console.log('📝 WordPress API client initialized\n');

    const results: DiscoveryResults = {
      connection_test: null,
      endpoint_discovery: null,
      generate_endpoints: null,
      endpoint_validation: null,
      session_info: {
        timestamp: new Date().toISOString(),
        session: 1,
        total_endpoints: 0,
        accessible_endpoints: 0,
        generate_specific: 0
      }
    };

    // Step 1: Test Connection
    console.log('🔍 Step 1: Testing WordPress connection and authentication...');
    const connectionTest = await api.testConnection();
    results.connection_test = connectionTest;
    
    if (!connectionTest.success) {
      console.error('❌ Connection test failed. Aborting discovery.');
      return results;
    }
    
    console.log(`✅ Connected to: ${connectionTest.data?.site_name}`);
    console.log(`   Namespaces available: ${connectionTest.data?.namespaces?.length || 0}`);
    console.log('');

    // Step 2: Endpoint Discovery
    console.log('🔍 Step 2: Discovering all available endpoints...');
    const endpointDiscovery = await api.discoverEndpoints();
    results.endpoint_discovery = endpointDiscovery;
    
    if (endpointDiscovery.success && endpointDiscovery.data) {
      const namespaces = Object.keys(endpointDiscovery.data);
      let totalRoutes = 0;
      
      for (const [namespace, info] of Object.entries(endpointDiscovery.data)) {
        const routeCount = Object.keys(info.routes).length;
        totalRoutes += routeCount;
        console.log(`   📂 ${namespace}: ${routeCount} routes`);
      }
      
      results.session_info.total_endpoints = totalRoutes;
      console.log(`✅ Discovered ${namespaces.length} namespaces with ${totalRoutes} total routes\n`);
    }

    // Step 3: GeneratePress/GenerateBlocks Analysis
    console.log('🔍 Step 3: Analyzing GeneratePress/GenerateBlocks endpoints...');
    const generateEndpoints = await api.getGenerateEndpoints();
    results.generate_endpoints = generateEndpoints;
    
    if (generateEndpoints.success && generateEndpoints.data) {
      const gpCount = Object.keys(generateEndpoints.data.generatepress).length;
      const gbCount = Object.keys(generateEndpoints.data.generateblocks).length;
      const customCount = Object.keys(generateEndpoints.data.custom_post_types).length;
      
      console.log(`   🎨 GeneratePress endpoints: ${gpCount}`);
      console.log(`   🧱 GenerateBlocks endpoints: ${gbCount}`);
      console.log(`   ⚙️ Custom/Theme endpoints: ${customCount}`);
      
      results.session_info.generate_specific = gpCount + gbCount + customCount;
      console.log(`✅ Found ${results.session_info.generate_specific} Generate-specific endpoints\n`);
    }

    // Step 4: Endpoint Validation
    console.log('🔍 Step 4: Validating endpoint accessibility...');
    
    // Test key endpoints for accessibility
    const testEndpoints = [
      '/wp-json/',
      '/wp-json/wp/v2/',
      '/wp-json/wp/v2/posts',
      '/wp-json/wp/v2/pages',
      '/wp-json/wp/v2/media',
      '/wp-json/wp/v2/users',
      '/wp-json/wp/v2/block-types',
      '/wp-json/wp/v2/block-patterns/patterns',
      '/wp-json/wp/v2/templates',
      '/wp-json/wp/v2/template-parts',
      '/wp-json/wp/v2/settings'
    ];

    // Add GenerateBlocks endpoint if discovered
    if (generateEndpoints.success && 
        generateEndpoints.data?.generateblocks && 
        Object.keys(generateEndpoints.data.generateblocks).length > 0) {
      testEndpoints.push('/wp-json/generateblocks/v1/');
    }

    const validation = await api.validateEndpointAccess(testEndpoints);
    results.endpoint_validation = validation;
    
    if (validation.success && validation.data) {
      const accessibleCount = Object.values(validation.data).filter(r => r.accessible).length;
      results.session_info.accessible_endpoints = accessibleCount;
      
      console.log(`✅ Endpoint validation complete: ${accessibleCount}/${testEndpoints.length} accessible`);
      
      // Show detailed results
      for (const [endpoint, result] of Object.entries(validation.data)) {
        const status = result.accessible ? '✅' : '❌';
        console.log(`   ${status} ${endpoint}`);
      }
      console.log('');
    }

    // Save results
    console.log('💾 Saving discovery results...');
    
    const wpComponentsDir = join(process.cwd(), 'wp-components');
    const endpointsFile = join(wpComponentsDir, 'endpoints-discovered.json');
    
    writeFileSync(endpointsFile, JSON.stringify(results, null, 2));
    console.log(`✅ Results saved to: ${endpointsFile}`);

    // Summary
    console.log('\n📊 SESSION 1 SUMMARY:');
    console.log(`   Connection: ${connectionTest.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Total Namespaces: ${Object.keys(results.endpoint_discovery?.data || {}).length}`);
    console.log(`   Total Routes: ${results.session_info.total_endpoints}`);
    console.log(`   Generate-Specific: ${results.session_info.generate_specific}`);
    console.log(`   Accessible Endpoints: ${results.session_info.accessible_endpoints}/${testEndpoints.length}`);
    console.log(`   Session Complete: ${new Date().toLocaleString()}`);

    return results;

  } catch (error) {
    console.error('❌ API Discovery failed:', error);
    throw error;
  }
}

// Run discovery if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAPIDiscovery()
    .then(() => {
      console.log('\n🎉 WordPress API Discovery completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Discovery failed:', error);
      process.exit(1);
    });
}

export { runAPIDiscovery };