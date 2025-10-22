// Test script to verify registration functionality

async function testRegistration() {
  console.log('=== Testing Registration Functionality ===\n');
  
  // Test patient registration
  console.log('1. Testing patient registration...');
  try {
    const patientResponse = await fetch('http://localhost:3001/api/register/patient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: 'TEST001',
        name: 'Test Patient',
        age: 30,
        gender: 'Male',
        contact: '1234567890',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const patientResult = await patientResponse.json();
    console.log(`   Status: ${patientResponse.status}`);
    console.log(`   Message: ${patientResult.message || patientResult.error}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test doctor registration
  console.log('\n2. Testing doctor registration...');
  try {
    const doctorResponse = await fetch('http://localhost:3001/api/register/doctor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctor_id: 'TESTDOC001',
        name: 'Test Doctor',
        specialty: 'Cardiology',
        experience: 5,
        contact: '1234567890',
        email: 'doctor@example.com',
        password: 'password123',
        reference_number: 'REF123'
      })
    });
    
    const doctorResult = await doctorResponse.json();
    console.log(`   Status: ${doctorResponse.status}`);
    console.log(`   Message: ${doctorResult.message || doctorResult.error}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test fetching registrations
  console.log('\n3. Fetching registrations...');
  try {
    const patientsResponse = await fetch('http://localhost:3001/api/register/patients');
    const patients = await patientsResponse.json();
    console.log(`   Found ${patients.length} patient registrations`);
    
    const doctorsResponse = await fetch('http://localhost:3001/api/register/doctors');
    const doctors = await doctorsResponse.json();
    console.log(`   Found ${doctors.length} doctor registrations`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n=== Registration Test Complete ===');
}

// Run the test
testRegistration().catch(console.error);