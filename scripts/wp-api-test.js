/**
 * WordPress API Connection Test
 * Session 1: WordPress REST API Discovery & Authentication
 * 
 * Simple JavaScript test to verify WordPress API connection
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// WordPress Configuration
const WP_CONFIG = {
  url: "https://cruisemadeeasy.com",
  api_base: "https://cruisemadeeasy.com/wp-json",
  credentials: {
    username: "support-team",
    password: "TMIi 8E5g NPxn 9B7F y4T0 L86q"
  }
};

// Create Basic Auth header
const authHeader = 'Basic ' + Buffer.from(`${WP_CONFIG.credentials.username}:${WP_CONFIG.credentials.password}`).toString('base64');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${WP_CONFIG.api_base}${endpoint}`;
    
    console.log(`🔍 Testing: ${endpoint}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'CME-Content-Worker/1.0 (WordPress Component Export)',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data,
        status: response.status,
        url: url
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status,
        url: url
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Request failed: ${error}`,
      status: 0,
      url: endpoint
    };
  }
}

async function runDiscovery() {
  console.log('🚀 WordPress API Discovery & Authentication Test\n');
  
  const results = {
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

  try {
    // Step 1: Test Basic Connection
    console.log('🔍 Step 1: Testing WordPress connection...');
    const connectionTest = await makeRequest('/wp-json/');
    results.connection_test = connectionTest;
    
    if (!connectionTest.success) {
      console.error('❌ Connection test failed:', connectionTest.error);
      return results;
    }
    
    console.log(`✅ Connected to: ${connectionTest.data?.name || 'WordPress Site'}`);
    console.log(`   Description: ${connectionTest.data?.description || 'No description'}`);
    console.log(`   URL: ${connectionTest.data?.url || 'Unknown'}`);
    console.log(`   Namespaces: ${connectionTest.data?.namespaces?.length || 0}`);
    
    if (connectionTest.data?.namespaces) {
      connectionTest.data.namespaces.forEach(ns => {
        console.log(`     • ${ns}`);
      });
    }
    console.log('');

    // Step 2: Endpoint Discovery
    console.log('🔍 Step 2: Analyzing available endpoints...');
    const routes = connectionTest.data?.routes || {};
    const namespaces = connectionTest.data?.namespaces || [];
    
    const endpointMap = {};
    
    // Organize routes by namespace
    for (const namespace of namespaces) {
      endpointMap[namespace] = {
        namespace,
        routes: {},
        methods: [],
        description: `Endpoints for ${namespace}`
      };

      // Find routes belonging to this namespace
      for (const [route, routeInfo] of Object.entries(routes)) {
        if (route.startsWith(`/${namespace}/`)) {
          endpointMap[namespace].routes[route] = routeInfo;
          
          // Extract unique methods
          const methods = routeInfo?.methods || [];
          for (const method of methods) {
            if (!endpointMap[namespace].methods.includes(method)) {
              endpointMap[namespace].methods.push(method);
            }
          }
        }
      }
      
      const routeCount = Object.keys(endpointMap[namespace].routes).length;
      console.log(`   📂 ${namespace}: ${routeCount} routes`);
    }
    
    results.endpoint_discovery = {
      success: true,
      data: endpointMap
    };
    
    const totalRoutes = Object.keys(routes).length;
    results.session_info.total_endpoints = totalRoutes;
    console.log(`✅ Discovered ${namespaces.length} namespaces with ${totalRoutes} total routes\n`);

    // Step 3: GeneratePress/GenerateBlocks Analysis
    console.log('🔍 Step 3: Searching for GeneratePress/GenerateBlocks...');
    const generateEndpoints = {
      generatepress: {},
      generateblocks: {},
      related_themes: {},
      custom_post_types: {}
    };

    // Search for Generate-related endpoints
    let generateCount = 0;
    for (const [namespace, info] of Object.entries(endpointMap)) {
      if (namespace.toLowerCase().includes('generate')) {
        generateCount++;
        if (namespace.toLowerCase().includes('blocks')) {
          generateEndpoints.generateblocks[namespace] = info;
          console.log(`   🧱 Found GenerateBlocks: ${namespace}`);
        } else if (namespace.toLowerCase().includes('press')) {
          generateEndpoints.generatepress[namespace] = info;
          console.log(`   🎨 Found GeneratePress: ${namespace}`);
        } else {
          generateEndpoints.related_themes[namespace] = info;
          console.log(`   ⚙️ Found Generate-related: ${namespace}`);
        }
      }
      
      // Check routes for Generate-related content
      for (const [route, routeInfo] of Object.entries(info.routes)) {
        const routeLower = route.toLowerCase();
        if (routeLower.includes('generate') || 
            routeLower.includes('theme') || 
            routeLower.includes('customizer')) {
          if (!generateEndpoints.custom_post_types[namespace]) {
            generateEndpoints.custom_post_types[namespace] = {};
          }
          generateEndpoints.custom_post_types[namespace][route] = routeInfo;
        }
      }
    }

    // Test GenerateBlocks specific endpoint
    console.log('   🔍 Testing GenerateBlocks endpoint...');
    const gbTest = await makeRequest('/wp-json/generateblocks/v1/');
    if (gbTest.success) {
      generateEndpoints.generateblocks['test_result'] = gbTest.data;
      generateCount++;
      console.log('   ✅ GenerateBlocks API is accessible');
    } else {
      console.log('   ❌ GenerateBlocks API not accessible');
    }
    
    results.generate_endpoints = {
      success: true,
      data: generateEndpoints
    };
    
    results.session_info.generate_specific = generateCount;
    console.log(`✅ Found ${generateCount} Generate-specific endpoints\n`);

    // Step 4: Endpoint Validation
    console.log('🔍 Step 4: Validating key endpoint access...');
    
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
      '/wp-json/wp/v2/settings',
      '/wp-json/generateblocks/v1/'
    ];

    const validationResults = {};
    let accessibleCount = 0;

    for (const endpoint of testEndpoints) {
      const result = await makeRequest(endpoint);
      validationResults[endpoint] = {
        accessible: result.success,
        status: result.status,
        error: result.error || null,
        data_preview: result.success && result.data ? 
          Object.keys(result.data).slice(0, 5) : null
      };
      
      if (result.success) {
        accessibleCount++;
        console.log(`   ✅ ${endpoint}`);
      } else {
        console.log(`   ❌ ${endpoint} - ${result.error}`);
      }
      
      // Rate limiting
      await sleep(500);
    }

    results.endpoint_validation = {
      success: true,
      data: validationResults
    };
    
    results.session_info.accessible_endpoints = accessibleCount;
    console.log(`✅ Endpoint validation: ${accessibleCount}/${testEndpoints.length} accessible\n`);

    // Save Results
    console.log('💾 Saving discovery results...');
    const endpointsFile = join(process.cwd(), 'wp-components', 'endpoints-discovered.json');
    writeFileSync(endpointsFile, JSON.stringify(results, null, 2));
    console.log(`✅ Results saved to: wp-components/endpoints-discovered.json`);

    // Summary
    console.log('\n📊 SESSION 1 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`   🔗 Connection: ${connectionTest.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   📁 Total Namespaces: ${namespaces.length}`);
    console.log(`   🌐 Total Routes: ${results.session_info.total_endpoints}`);
    console.log(`   🎨 Generate-Specific: ${results.session_info.generate_specific}`);
    console.log(`   ✅ Accessible Endpoints: ${accessibleCount}/${testEndpoints.length}`);
    console.log(`   ⏰ Completed: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));

    return results;

  } catch (error) {
    console.error('❌ Discovery failed:', error);
    results.error = error.toString();
    return results;
  }
}

// Run discovery
runDiscovery()
  .then((results) => {
    if (results.connection_test?.success) {
      console.log('\n🎉 WordPress API Discovery completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Discovery completed with errors');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Discovery failed:', error);
    process.exit(1);
  });