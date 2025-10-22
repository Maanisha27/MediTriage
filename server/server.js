import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080; // Use single port for both frontend and backend

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the dist directory (frontend build)
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize SQLite database
let db;
(async () => {
  db = await open({
    filename: './database.db',
    driver: sqlite3.Database
  });

  // Create patients table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT,
      age INTEGER,
      gender TEXT,
      symptoms TEXT,
      vitals TEXT,
      severity INTEGER,
      urgency INTEGER,
      resource_need INTEGER,
      waiting_impact INTEGER,
      risk_factor REAL,
      triage_score REAL,
      assigned_doctor_id TEXT,
      appointment_time TEXT
    )
  `);

  // Create doctors table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT,
      specialty TEXT,
      experience INTEGER,
      availability_status TEXT,
      success_rate REAL,
      resource_access INTEGER
    )
  `);

  // Create patient registrations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS patient_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT UNIQUE,
      name TEXT,
      age INTEGER,
      gender TEXT,
      contact TEXT,
      email TEXT,
      password TEXT,
      symptoms TEXT,
      vitals TEXT,
      registration_date TEXT,
      verified INTEGER DEFAULT 0
    )
  `);
  
  // Add symptoms and vitals columns if they don't exist (for existing databases)
  try {
    await db.exec(`ALTER TABLE patient_registrations ADD COLUMN symptoms TEXT`);
  } catch (e) {
    // Column already exists, ignore error
  }
  
  try {
    await db.exec(`ALTER TABLE patient_registrations ADD COLUMN vitals TEXT`);
  } catch (e) {
    // Column already exists, ignore error
  }

  // Create doctor registrations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS doctor_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id TEXT UNIQUE,
      name TEXT,
      specialty TEXT,
      experience INTEGER,
      contact TEXT,
      email TEXT,
      password TEXT,
      reference_number TEXT,
      registration_date TEXT,
      verified INTEGER DEFAULT 0
    )
  `);

  // Insert sample doctors if table is empty
  const doctorCount = await db.get('SELECT COUNT(*) as count FROM doctors');
  if (doctorCount.count === 0) {
    const sampleDoctors = [
      ['CARD_01', 'Dr. Sarah Johnson', 'Cardiology', 10, 'Available', 0.92, 90],
      ['NEUR_02', 'Dr. Michael Chen', 'Neurology', 8, 'Available', 0.90, 85],
      ['TRMA_03', 'Dr. Robert Williams', 'Trauma Surgery', 15, 'Busy', 0.95, 95],
      ['GENM_04', 'Dr. Emily Davis', 'General Medicine', 5, 'Available', 0.88, 80],
      ['EMER_05', 'Dr. James Wilson', 'Emergency Medicine', 12, 'Available', 0.91, 88],
      ['ORTH_06', 'Dr. Lisa Anderson', 'Orthopedics', 7, 'Available', 0.89, 82],
      ['PEDI_07', 'Dr. David Brown', 'Pediatrics', 6, 'Busy', 0.93, 78],
      ['ONCO_08', 'Dr. Maria Garcia', 'Oncology', 11, 'Available', 0.87, 85],
      ['PSYC_09', 'Dr. Thomas Lee', 'Psychiatry', 9, 'Available', 0.85, 75],
      ['DERM_10', 'Dr. Jennifer Taylor', 'Dermatology', 4, 'Available', 0.86, 70]
    ];

    for (const doctor of sampleDoctors) {
      await db.run(
        'INSERT INTO doctors (id, name, specialty, experience, availability_status, success_rate, resource_access) VALUES (?, ?, ?, ?, ?, ?, ?)',
        doctor
      );
    }
    console.log('Sample doctors inserted');
  }

  // Insert sample patients if table is empty
  const patientCount = await db.get('SELECT COUNT(*) as count FROM patients');
  if (patientCount.count === 0) {
    const samplePatients = [
      ['P001', 'John Smith', 60, 'Male', 'Chest pain, shortness of breath', 'BP: 140/90, HR: 110', 90, 85, 80, 90, 0.85, 0.92, 'CARD_01', '2023-06-15T10:30:00'],
      ['P002', 'Emma Wilson', 8, 'Female', 'Wheezing, difficulty breathing', 'SpO2: 88%, RR: 30', 80, 85, 70, 80, 0.75, 0.85, 'PEDI_07', '2023-06-15T11:00:00'],
      ['P003', 'Robert Brown', 72, 'Male', 'Hip pain, unable to walk', 'BP: 130/80, HR: 80', 85, 90, 85, 88, 0.82, 0.88, 'ORTH_06', '2023-06-15T10:45:00'],
      ['P004', 'Lisa Davis', 25, 'Female', 'Deep cut on arm', 'BP: 120/80, HR: 72', 30, 25, 20, 20, 0.20, 0.30, 'EMER_05', '2023-06-15T10:15:00'],
      ['P005', 'Michael Johnson', 55, 'Male', 'Sudden weakness, slurred speech', 'BP: 160/95, HR: 90', 90, 95, 90, 90, 0.90, 0.95, 'NEUR_02', '2023-06-15T10:00:00'],
      ['P006', 'Sarah Miller', 60, 'Female', 'High fever, cough, difficulty breathing', 'Temp: 39.5°C, SpO2: 92%', 85, 80, 75, 85, 0.78, 0.82, 'GENM_04', '2023-06-15T11:15:00'],
      ['P007', 'David Wilson', 35, 'Male', 'Abdominal pain, nausea', 'BP: 110/70, HR: 95', 70, 75, 60, 65, 0.65, 0.72, 'GENM_04', '2023-06-15T11:30:00'],
      ['P008', 'Jennifer Taylor', 50, 'Female', 'Arm pain, swelling', 'BP: 125/80, HR: 78', 60, 55, 50, 60, 0.55, 0.62, 'ORTH_06', '2023-06-15T11:45:00'],
      ['P009', 'Thomas Anderson', 28, 'Male', 'Severe headache', 'BP: 130/85, HR: 85', 40, 50, 20, 30, 0.35, 0.45, 'NEUR_02', '2023-06-15T12:00:00'],
      ['P010', 'Maria Garcia', 65, 'Female', 'Swelling in legs, shortness of breath', 'BP: 145/85, HR: 100', 85, 80, 90, 85, 0.80, 0.87, 'CARD_01', '2023-06-15T12:15:00']
    ];

    for (const patient of samplePatients) {
      await db.run(
        'INSERT INTO patients (id, name, age, gender, symptoms, vitals, severity, urgency, resource_need, waiting_impact, risk_factor, triage_score, assigned_doctor_id, appointment_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        patient
      );
    }
    console.log('Sample patients inserted');
  }
})();

// API Routes
// IMPORTANT: Define API routes BEFORE the catch-all route for React Router

// Get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await db.all('SELECT * FROM patients ORDER BY triage_score DESC');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', req.params.id);
    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new patient
app.post('/api/patients', async (req, res) => {
  try {
    const patient = req.body;
    await db.run(
      'INSERT INTO patients (id, name, age, gender, symptoms, vitals, severity, urgency, resource_need, waiting_impact, risk_factor, triage_score, assigned_doctor_id, appointment_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        patient.id,
        patient.name,
        patient.age,
        patient.gender,
        patient.symptoms,
        patient.vitals,
        patient.severity,
        patient.urgency,
        patient.resource_need,
        patient.waiting_impact,
        patient.risk_factor,
        patient.triage_score,
        patient.assigned_doctor_id,
        patient.appointment_time
      ]
    );
    res.status(201).json({ message: 'Patient added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient
app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = req.body;
    await db.run(
      'UPDATE patients SET name = ?, age = ?, gender = ?, symptoms = ?, vitals = ?, severity = ?, urgency = ?, resource_need = ?, waiting_impact = ?, risk_factor = ?, triage_score = ?, assigned_doctor_id = ?, appointment_time = ? WHERE id = ?',
      [
        patient.name,
        patient.age,
        patient.gender,
        patient.symptoms,
        patient.vitals,
        patient.severity,
        patient.urgency,
        patient.resource_need,
        patient.waiting_impact,
        patient.risk_factor,
        patient.triage_score,
        patient.assigned_doctor_id,
        patient.appointment_time,
        req.params.id
      ]
    );
    res.json({ message: 'Patient updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM patients WHERE id = ?', req.params.id);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await db.all('SELECT * FROM doctors');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor by ID
app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', req.params.id);
    if (doctor) {
      res.json(doctor);
    } else {
      res.status(404).json({ error: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update doctor availability
app.put('/api/doctors/:id/availability', async (req, res) => {
  try {
    const { availability_status } = req.body;
    await db.run(
      'UPDATE doctors SET availability_status = ? WHERE id = ?',
      [availability_status, req.params.id]
    );
    res.json({ message: 'Doctor availability updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient Registration
app.post('/api/register/patient', async (req, res) => {
  try {
    const { patient_id, name, age, gender, contact, email, password, symptoms, vitals } = req.body;
    
    // Check if patient ID already exists
    const existingPatient = await db.get('SELECT * FROM patient_registrations WHERE patient_id = ?', [patient_id]);
    if (existingPatient) {
      return res.status(400).json({ error: 'Patient ID already exists' });
    }
    
    // Insert new patient registration
    await db.run(
      'INSERT INTO patient_registrations (patient_id, name, age, gender, contact, email, password, symptoms, vitals, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, name, age, gender, contact, email, password, symptoms || '', vitals || '', new Date().toISOString()]
    );
    
    res.status(201).json({ message: 'Patient registration submitted successfully. Awaiting verification.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor Registration
app.post('/api/register/doctor', async (req, res) => {
  try {
    const { doctor_id, name, specialty, experience, contact, email, password, reference_number } = req.body;
    
    // Check if doctor ID already exists
    const existingDoctor = await db.get('SELECT * FROM doctor_registrations WHERE doctor_id = ?', [doctor_id]);
    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor ID already exists' });
    }
    
    // Insert new doctor registration
    await db.run(
      'INSERT INTO doctor_registrations (doctor_id, name, specialty, experience, contact, email, password, reference_number, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [doctor_id, name, specialty, experience, contact, email, password, reference_number, new Date().toISOString()]
    );
    
    res.status(201).json({ message: 'Doctor registration submitted successfully. Awaiting verification.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Patient Registration
app.put('/api/register/patient/:id/verify', async (req, res) => {
  try {
    await db.run(
      'UPDATE patient_registrations SET verified = 1 WHERE patient_id = ?',
      [req.params.id]
    );
    
    // Get the verified patient details
    const patient = await db.get('SELECT * FROM patient_registrations WHERE patient_id = ?', [req.params.id]);
    
    // Add to main patients table with default triage values
    await db.run(
      'INSERT INTO patients (id, name, age, gender, symptoms, vitals, severity, urgency, resource_need, waiting_impact, risk_factor, triage_score, assigned_doctor_id, appointment_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        patient.patient_id, 
        patient.name, 
        patient.age, 
        patient.gender,
        patient.symptoms || '', // symptoms
        patient.vitals || '', // vitals
        0,  // severity
        0,  // urgency
        0,  // resource_need
        0,  // waiting_impact
        0.0, // risk_factor
        0.0, // triage_score
        '', // assigned_doctor_id
        new Date().toISOString() // appointment_time
      ]
    );
    
    res.json({ message: 'Patient verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Doctor Registration
app.put('/api/register/doctor/:id/verify', async (req, res) => {
  try {
    await db.run(
      'UPDATE doctor_registrations SET verified = 1 WHERE doctor_id = ?',
      [req.params.id]
    );
    
    // Get the verified doctor details
    const doctor = await db.get('SELECT * FROM doctor_registrations WHERE doctor_id = ?', [req.params.id]);
    
    // Add to main doctors table
    await db.run(
      'INSERT INTO doctors (id, name, specialty, experience, availability_status, success_rate, resource_access) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [doctor.doctor_id, doctor.name, doctor.specialty, doctor.experience, 'Available', 0.85, 80]
    );
    
    res.json({ message: 'Doctor verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all patient registrations
app.get('/api/register/patients', async (req, res) => {
  try {
    const patients = await db.all('SELECT * FROM patient_registrations');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all doctor registrations
app.get('/api/register/doctors', async (req, res) => {
  try {
    const doctors = await db.all('SELECT * FROM doctor_registrations');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Medical Triage System API is running' });
});

// IMPORTANT: Catch-all route for React Router should be LAST
// Serve frontend for SPA routes (catch-all route for React Router)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Medical Triage System running on http://localhost:${PORT}`);
  console.log(`Frontend and API both served from the same port`);
});