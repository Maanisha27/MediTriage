// Test script to verify registration verification functionality

async function testVerification() {
  console.log('=== Testing Verification Functionality ===\n');
  
  // Test patient verification
  console.log('1. Testing patient verification...');
  try {
    const patientResponse = await fetch('http://localhost:3001/api/register/patient/TEST001/verify', {
      method: 'PUT'
    });
    
    const patientResult = await patientResponse.json();
    console.log(`   Status: ${patientResponse.status}`);
    console.log(`   Message: ${patientResult.message || patientResult.error}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test doctor verification
  console.log('\n2. Testing doctor verification...');
  try {
    const doctorResponse = await fetch('http://localhost:3001/api/register/doctor/TESTDOC001/verify', {
      method: 'PUT'
    });
    
    const doctorResult = await doctorResponse.json();
    console.log(`   Status: ${doctorResponse.status}`);
    console.log(`   Message: ${doctorResult.message || doctorResult.error}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test fetching main patients and doctors
  console.log('\n3. Fetching main patients and doctors...');
  try {
    const patientsResponse = await fetch('http://localhost:3001/api/patients');
    const patients = await patientsResponse.json();
    console.log(`   Found ${patients.length} patients in main table`);
    
    const doctorsResponse = await fetch('http://localhost:3001/api/doctors');
    const doctors = await doctorsResponse.json();
    console.log(`   Found ${doctors.length} doctors in main table`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n=== Verification Test Complete ===');
}

// Run the test
testVerification().catch(console.error);