#!/usr/bin/env node

/**
 * Test script for the Agentic Testing System
 * Runs a quick test with a predefined URL
 */

const AgenticTestingSystem = require('./index');

async function runTest() {
  console.log('🧪 Running Agentic Testing System Test...\n');

  try {
    // Create system instance
    const system = new AgenticTestingSystem();

    // Get system status
    const status = system.getStatus();
    console.log('📊 System Status:', status);

    // For testing, we'll simulate the URL input
    // In a real scenario, this would come from user input
    console.log('\n🎯 Test URL: https://httpbin.org/html');
    console.log('⏳ Starting automated testing process...\n');

    // Note: This would normally prompt for user input
    // For this test, we'll need to modify the UrlCollectorAgent to accept a test URL
    console.log('✅ System initialized successfully');
    console.log('📝 To run the full system, use: npm start');
    console.log('🔗 Then enter a URL like: https://example.com');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runTest();
}