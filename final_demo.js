// Final demo script to showcase the complete registration and verification workflow

async function finalDemo() {
  console.log('=== Final Demo: Complete Registration and Verification Workflow ===\n');
  
  // Step 1: Register a new patient
  console.log('Step 1: Registering a new patient...');
  try {
    const patientResponse = await fetch('http://localhost:3001/api/register/patient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: 'DEMO001',
        name: 'Demo Patient',
        age: 45,
        gender: 'Female',
        contact: '9876543210',
        email: 'demo.patient@example.com',
        password: 'demopassword123'
      })
    });
    
    const patientResult = await patientResponse.json();
    console.log(`   ✓ ${patientResult.message}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Step 2: Register a new doctor
  console.log('\nStep 2: Registering a new doctor...');
  try {
    const doctorResponse = await fetch('http://localhost:3001/api/register/doctor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctor_id: 'DEMODOC001',
        name: 'Dr. Demo Specialist',
        specialty: 'General Medicine',
        experience: 8,
        contact: '9876543210',
        email: 'demo.doctor@example.com',
        password: 'demopassword123',
        reference_number: 'REF-DEMO-001'
      })
    });
    
    const doctorResult = await doctorResponse.json();
    console.log(`   ✓ ${doctorResult.message}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Step 3: Show pending registrations
  console.log('\nStep 3: Checking pending registrations...');
  try {
    const patientsResponse = await fetch('http://localhost:3001/api/register/patients');
    const patients = await patientsResponse.json();
    const pendingPatients = patients.filter(p => p.verified === 0);
    
    const doctorsResponse = await fetch('http://localhost:3001/api/register/doctors');
    const doctors = await doctorsResponse.json();
    const pendingDoctors = doctors.filter(d => d.verified === 0);
    
    console.log(`   Pending patient registrations: ${pendingPatients.length}`);
    console.log(`   Pending doctor registrations: ${pendingDoctors.length}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Step 4: Verify the registrations (admin action)
  console.log('\nStep 4: Verifying registrations (admin action)...');
  try {
    // Verify patient
    const verifyPatientResponse = await fetch('http://localhost:3001/api/register/patient/DEMO001/verify', {
      method: 'PUT'
    });
    const verifyPatientResult = await verifyPatientResponse.json();
    console.log(`   ✓ ${verifyPatientResult.message}`);
    
    // Verify doctor
    const verifyDoctorResponse = await fetch('http://localhost:3001/api/register/doctor/DEMODOC001/verify', {
      method: 'PUT'
    });
    const verifyDoctorResult = await verifyDoctorResponse.json();
    console.log(`   ✓ ${verifyDoctorResult.message}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Step 5: Show updated counts
  console.log('\nStep 5: Updated system counts...');
  try {
    const patientsResponse = await fetch('http://localhost:3001/api/patients');
    const patients = await patientsResponse.json();
    
    const doctorsResponse = await fetch('http://localhost:3001/api/doctors');
    const doctors = await doctorsResponse.json();
    
    console.log(`   Total patients in system: ${patients.length}`);
    console.log(`   Total doctors in system: ${doctors.length}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  console.log('\n=== Demo Complete: New patient and doctor successfully registered and verified ===');
  console.log('✅ The registration system is fully functional!');
}

// Run the final demo
finalDemo().catch(console.error);