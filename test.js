// Test script to verify all components of the AI Medical Triage System

import http from 'http';
import { existsSync } from 'fs';

async function testEndpoint(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      const status = res.statusCode;
      const success = status === expectedStatus;
      console.log(`  ${success ? '✅' : '❌'} ${url} - Status: ${status}`);
      resolve(success);
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ ${url} - Error: ${error.message}`);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🧪 Testing AI Medical Triage System Components...\n');
  
  let allTestsPassed = true;
  
  // Test backend endpoints
  console.log('Backend API Tests:');
  const backendTests = [
    testEndpoint('http://localhost:3001/api/health'),
    testEndpoint('http://localhost:3001/api/patients'),
    testEndpoint('http://localhost:3001/api/doctors')
  ];
  
  const backendResults = await Promise.all(backendTests);
  if (!backendResults.every(result => result)) {
    allTestsPassed = false;
  }
  
  console.log();
  
  // Test frontend routes
  console.log('Frontend Route Tests:');
  const frontendTests = [
    testEndpoint('http://localhost:3001/'),
    testEndpoint('http://localhost:3001/login'),
    testEndpoint('http://localhost:3001/dashboard'),
    testEndpoint('http://localhost:3001/triage'),
    testEndpoint('http://localhost:3001/routing')
  ];
  
  const frontendResults = await Promise.all(frontendTests);
  if (!frontendResults.every(result => result)) {
    allTestsPassed = false;
  }
  
  console.log();
  
  // Test database file
  console.log('Database Test:');
  try {
    const dbExists = existsSync('./database.db');
    console.log(`  ${dbExists ? '✅' : '❌'} Database file exists`);
    if (!dbExists) allTestsPassed = false;
  } catch (error) {
    console.log(`  ❌ Database test failed: ${error.message}`);
    allTestsPassed = false;
  }
  
  console.log();
  
  // Final result
  if (allTestsPassed) {
    console.log('🎉 All tests passed! The system is working correctly.');
    console.log('🚀 You can now run "npm start" to start the application.');
  } else {
    console.log('❌ Some tests failed. Please check the system setup.');
  }
}

// Run tests
runTests().catch(console.error);