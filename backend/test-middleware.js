/**
 * Test Middleware Logging
 * Run this file to test the middleware integration and logging
 */

const testEndpoints = async () => {
  const baseUrl = 'http://localhost:5000';

  console.log('🧪 Testing Middleware Logging...\n');

  try {
    // Test 1: Root endpoint (should work)
    console.log('1️⃣  Testing root endpoint (/)');
    const response1 = await fetch(baseUrl);
    const data1 = await response1.json();
    console.log('   Response:', data1.message);
    console.log('');

    // Wait a bit to see logs
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Health check (should work)
    console.log('2️⃣  Testing health endpoint (/health)');
    const response2 = await fetch(`${baseUrl}/health`);
    const data2 = await response2.json();
    console.log('   Response:', data2.message);
    console.log('');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: 404 error (should trigger notFound middleware)
    console.log('3️⃣  Testing 404 endpoint (/nonexistent)');
    const response3 = await fetch(`${baseUrl}/nonexistent`);
    const data3 = await response3.json();
    console.log('   Response:', data3.message);
    console.log('');

    console.log('✅ Tests completed! Check your server console for middleware logs.');
    console.log('\nExpected logs in server console:');
    console.log('  📥 - Incoming request');
    console.log('  ✅ - Successful response (200)');
    console.log('  ⚠️  - Client error (404)');
    
  } catch (error) {
    console.error('❌ Error running tests:', error.message);
  }
};

// Run tests
testEndpoints();
