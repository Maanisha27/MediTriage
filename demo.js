// Demo script to showcase the AI Medical Triage System capabilities

async function runDemo() {
  console.log('=== AI Medical Triage System Demo ===\n');
  
  // 1. Fetch all patients
  console.log('1. Fetching all patients...');
  const patientsResponse = await fetch('http://localhost:3001/api/patients');
  const patients = await patientsResponse.json();
  console.log(`   Found ${patients.length} patients in the system\n`);
  
  // 2. Show top 3 prioritized patients
  console.log('2. Top 3 prioritized patients:');
  patients.slice(0, 3).forEach((patient, index) => {
    console.log(`   ${index + 1}. ${patient.name} (${patient.id}) - Triage Score: ${patient.triage_score.toFixed(3)}`);
  });
  console.log();
  
  // 3. Fetch all doctors
  console.log('3. Fetching all doctors...');
  const doctorsResponse = await fetch('http://localhost:3001/api/doctors');
  const doctors = await doctorsResponse.json();
  console.log(`   Found ${doctors.length} doctors in the system\n`);
  
  // 4. Show doctor specialties
  console.log('4. Doctor specialties:');
  doctors.forEach(doctor => {
    console.log(`   - ${doctor.name} (${doctor.id}): ${doctor.specialty} - Success Rate: ${(doctor.success_rate * 100).toFixed(1)}%`);
  });
  console.log();
  
  // 5. Show patient-doctor assignments
  console.log('5. Patient-Doctor Assignments:');
  patients.slice(0, 5).forEach(patient => {
    const doctor = doctors.find(d => d.id === patient.assigned_doctor_id);
    if (doctor) {
      console.log(`   - ${patient.name} assigned to ${doctor.name} (${doctor.specialty})`);
    }
  });
  console.log();
  
  // 6. Add a new patient
  console.log('6. Adding a new patient...');
  const newPatient = {
    id: 'P011',
    name: 'Demo Patient',
    age: 45,
    gender: 'Male',
    symptoms: 'Chest pain and shortness of breath',
    vitals: 'BP: 140/90, HR: 100',
    severity: 85,
    urgency: 80,
    resource_need: 75,
    waiting_impact: 85,
    risk_factor: 0.75,
    triage_score: 0.88,
    assigned_doctor_id: 'CARD_01',
    appointment_time: new Date().toISOString()
  };
  
  const addResponse = await fetch('http://localhost:3001/api/patients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newPatient)
  });
  
  if (addResponse.ok) {
    console.log('   New patient added successfully!\n');
  } else {
    console.log('   Failed to add new patient\n');
  }
  
  // 7. System statistics
  console.log('7. System Statistics:');
  const criticalPatients = patients.filter(p => p.triage_score >= 0.9).length;
  const avgTriageScore = patients.reduce((sum, p) => sum + p.triage_score, 0) / patients.length;
  const avgDoctorSuccessRate = doctors.reduce((sum, d) => sum + d.success_rate, 0) / doctors.length;
  
  console.log(`   - Critical Patients: ${criticalPatients}/${patients.length}`);
  console.log(`   - Average Triage Score: ${avgTriageScore.toFixed(3)}`);
  console.log(`   - Average Doctor Success Rate: ${(avgDoctorSuccessRate * 100).toFixed(1)}%`);
  console.log();
  
  console.log('=== Demo Complete ===');
  console.log('Visit http://localhost:3001 to interact with the full web interface!');
}

// Run the demo
runDemo().catch(console.error);