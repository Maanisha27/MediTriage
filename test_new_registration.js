// Test script to verify the updated registration system

async function testNewRegistration() {
  console.log('=== Testing Updated Registration System ===\n');
  
  // Step 1: Register a new patient with symptoms and vitals
  console.log('Step 1: Registering a new patient with symptoms and vitals...');
  try {
    const patientResponse = await fetch('http://localhost:3001/api/register/patient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: 'NEW001',
        name: 'Newly Registered Patient',
        age: 35,
        gender: 'Male',
        contact: '1234567890',
        email: 'new.patient@example.com',
        password: 'password123',
        symptoms: 'Headache and dizziness',
        vitals: 'BP: 130/85, HR: 80'
      })
    });
    
    const patientResult = await patientResponse.json();
    console.log(`   Status: ${patientResponse.status}`);
    console.log(`   Message: ${patientResult.message || patientResult.error}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Step 2: Verify the patient registration
  console.log('\nStep 2: Verifying the patient registration...');
  try {
    const verifyResponse = await fetch('http://localhost:3001/api/register/patient/NEW001/verify', {
      method: 'PUT'
    });
    
    const verifyResult = await verifyResponse.json();
    console.log(`   Status: ${verifyResponse.status}`);
    console.log(`   Message: ${verifyResult.message || verifyResult.error}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Step 3: Check if the patient exists in the main patients table
  console.log('\nStep 3: Checking if patient exists in main patients table...');
  try {
    const patientResponse = await fetch('http://localhost:3001/api/patients/NEW001');
    
    if (patientResponse.ok) {
      const patient = await patientResponse.json();
      console.log(`   Status: ${patientResponse.status}`);
      console.log(`   Patient found: ${patient.name}`);
      console.log(`   Symptoms: ${patient.symptoms}`);
      console.log(`   Vitals: ${patient.vitals}`);
      console.log(`   Age: ${patient.age}`);
      console.log(`   Gender: ${patient.gender}`);
    } else {
      console.log(`   Status: ${patientResponse.status}`);
      console.log(`   Error: Patient not found`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Step 4: Check all patients
  console.log('\nStep 4: Checking total number of patients...');
  try {
    const patientsResponse = await fetch('http://localhost:3001/api/patients');
    const patients = await patientsResponse.json();
    console.log(`   Total patients in system: ${patients.length}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testNewRegistration().catch(console.error);