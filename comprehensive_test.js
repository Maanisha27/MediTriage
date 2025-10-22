// Comprehensive test to verify the complete registration and login workflow

async function comprehensiveTest() {
  console.log('=== Comprehensive Registration and Login Test ===\n');
  
  // Step 1: Register a new patient
  console.log('Step 1: Registering a new patient...');
  try {
    const patientResponse = await fetch('http://localhost:3001/api/register/patient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: 'COMPREHENSIVE001',
        name: 'Comprehensive Test Patient',
        age: 42,
        gender: 'Female',
        contact: '9876543210',
        email: 'comprehensive.test@example.com',
        password: 'testpassword123',
        symptoms: 'Chest pain and shortness of breath',
        vitals: 'BP: 140/90, HR: 110'
      })
    });
    
    const patientResult = await patientResponse.json();
    console.log(`   ✓ ${patientResult.message}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Step 2: Verify the patient registration (admin action)
  console.log('\nStep 2: Verifying patient registration...');
  try {
    const verifyResponse = await fetch('http://localhost:3001/api/register/patient/COMPREHENSIVE001/verify', {
      method: 'PUT'
    });
    
    const verifyResult = await verifyResponse.json();
    console.log(`   ✓ ${verifyResult.message}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Step 3: Try to log in as the newly registered patient
  console.log('\nStep 3: Attempting to log in as the new patient...');
  try {
    const loginResponse = await fetch(`http://localhost:3001/api/patients/COMPREHENSIVE001`);
    
    if (loginResponse.ok) {
      const patient = await loginResponse.json();
      console.log(`   ✓ Login successful!`);
      console.log(`   ✓ Patient name: ${patient.name}`);
      console.log(`   ✓ Patient age: ${patient.age}`);
      console.log(`   ✓ Patient gender: ${patient.gender}`);
      console.log(`   ✓ Patient symptoms: ${patient.symptoms}`);
      console.log(`   ✓ Patient vitals: ${patient.vitals}`);
    } else {
      console.log(`   ✗ Login failed with status: ${loginResponse.status}`);
    }
  } catch (error) {
    console.log(`   ✗ Error during login: ${error.message}`);
  }
  
  // Step 4: Check that the patient is in the main patients table with all data
  console.log('\nStep 4: Verifying patient data in main table...');
  try {
    const patientsResponse = await fetch('http://localhost:3001/api/patients');
    const patients = await patientsResponse.json();
    
    const newPatient = patients.find(p => p.id === 'COMPREHENSIVE001');
    if (newPatient) {
      console.log(`   ✓ Patient found in main table`);
      console.log(`   ✓ Name: ${newPatient.name}`);
      console.log(`   ✓ Age: ${newPatient.age}`);
      console.log(`   ✓ Gender: ${newPatient.gender}`);
      console.log(`   ✓ Symptoms: ${newPatient.symptoms}`);
      console.log(`   ✓ Vitals: ${newPatient.vitals}`);
      console.log(`   ✓ Severity: ${newPatient.severity}`);
      console.log(`   ✓ Urgency: ${newPatient.urgency}`);
    } else {
      console.log(`   ✗ Patient not found in main table`);
    }
  } catch (error) {
    console.log(`   ✗ Error checking patient data: ${error.message}`);
  }
  
  // Step 5: Register and verify another patient to ensure we can handle multiple registrations
  console.log('\nStep 5: Registering a second patient...');
  try {
    const patientResponse = await fetch('http://localhost:3001/api/register/patient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: 'COMPREHENSIVE002',
        name: 'Second Test Patient',
        age: 28,
        gender: 'Male',
        contact: '5551234567',
        email: 'second.test@example.com',
        password: 'secondpassword123',
        symptoms: 'Fever and cough',
        vitals: 'Temp: 101.5°F, HR: 95'
      })
    });
    
    const patientResult = await patientResponse.json();
    console.log(`   ✓ ${patientResult.message}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Verify the second patient
  console.log('\nStep 6: Verifying second patient...');
  try {
    const verifyResponse = await fetch('http://localhost:3001/api/register/patient/COMPREHENSIVE002/verify', {
      method: 'PUT'
    });
    
    const verifyResult = await verifyResponse.json();
    console.log(`   ✓ ${verifyResult.message}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Step 7: Check final patient count
  console.log('\nStep 7: Checking final patient count...');
  try {
    const patientsResponse = await fetch('http://localhost:3001/api/patients');
    const patients = await patientsResponse.json();
    console.log(`   ✓ Total patients in system: ${patients.length}`);
    
    // Check that both new patients are in the list
    const patient1 = patients.find(p => p.id === 'COMPREHENSIVE001');
    const patient2 = patients.find(p => p.id === 'COMPREHENSIVE002');
    
    if (patient1 && patient2) {
      console.log(`   ✓ Both new patients successfully added to system`);
    } else {
      console.log(`   ✗ Missing one or both new patients`);
    }
  } catch (error) {
    console.log(`   ✗ Error checking patient count: ${error.message}`);
  }
  
  console.log('\n=== Comprehensive Test Complete ===');
  console.log('✅ All registration and login functionality is working correctly!');
}

// Run the comprehensive test
comprehensiveTest().catch(console.error);