/**
 * Simple WordPress API Fetch Test
 * Debug Node.js fetch vs curl differences
 */

const WP_CONFIG = {
  url: "https://cruisemadeeasy.com",
  api_base: "https://cruisemadeeasy.com/wp-json",
  credentials: {
    username: "support-team",
    password: "TMIi 8E5g NPxn 9B7F y4T0 L86q"
  }
};

const authHeader = 'Basic ' + Buffer.from(`${WP_CONFIG.credentials.username}:${WP_CONFIG.credentials.password}`).toString('base64');

async function testFetch() {
  console.log('🧪 Testing different fetch configurations...\n');

  // Test 1: No authentication, minimal headers
  console.log('Test 1: Basic fetch (no auth)');
  try {
    const response1 = await fetch('https://cruisemadeeasy.com/wp-json/');
    console.log(`Status: ${response1.status}`);
    if (response1.ok) {
      const data = await response1.json();
      console.log(`✅ Success - Site: ${data.name}`);
    } else {
      const error = await response1.text();
      console.log(`❌ Error: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }
  console.log('');

  // Test 2: With authentication
  console.log('Test 2: With Basic Auth');
  try {
    const response2 = await fetch('https://cruisemadeeasy.com/wp-json/', {
      headers: {
        'Authorization': authHeader
      }
    });
    console.log(`Status: ${response2.status}`);
    if (response2.ok) {
      const data = await response2.json();
      console.log(`✅ Success - Site: ${data.name}`);
    } else {
      const error = await response2.text();
      console.log(`❌ Error: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }
  console.log('');

  // Test 3: With standard browser headers
  console.log('Test 3: With browser-like headers');
  try {
    const response3 = await fetch('https://cruisemadeeasy.com/wp-json/', {
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    console.log(`Status: ${response3.status}`);
    if (response3.ok) {
      const data = await response3.json();
      console.log(`✅ Success - Site: ${data.name}`);
    } else {
      const error = await response3.text();
      console.log(`❌ Error: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }
  console.log('');

  // Test 4: Try wp/v2 endpoint
  console.log('Test 4: Try wp/v2 endpoint');
  try {
    const response4 = await fetch('https://cruisemadeeasy.com/wp-json/wp/v2/', {
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    console.log(`Status: ${response4.status}`);
    if (response4.ok) {
      const data = await response4.json();
      console.log(`✅ Success - Endpoints: ${Object.keys(data).length}`);
    } else {
      const error = await response4.text();
      console.log(`❌ Error: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }
}

testFetch();