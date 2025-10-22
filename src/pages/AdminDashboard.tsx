import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, User, Stethoscope, Check, X } from 'lucide-react';

interface PatientRegistration {
  id: number;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  email: string;
  symptoms: string;
  vitals: string;
  registration_date: string;
  verified: number;
}

interface DoctorRegistration {
  id: number;
  doctor_id: string;
  name: string;
  specialty: string;
  experience: number;
  contact: string;
  email: string;
  reference_number: string;
  registration_date: string;
  verified: number;
}

const AdminDashboard = () => {
  const [patientRegistrations, setPatientRegistrations] = useState<PatientRegistration[]>([]);
  const [doctorRegistrations, setDoctorRegistrations] = useState<DoctorRegistration[]>([]);
  const [activeTab, setActiveTab] = useState<'patients' | 'doctors'>('patients');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      // Use relative paths for API calls since frontend and backend are on the same port
      const [patientsRes, doctorsRes] = await Promise.all([
        fetch('/api/register/patients'),
        fetch('/api/register/doctors')
      ]);

      if (patientsRes.ok && doctorsRes.ok) {
        const patientsData = await patientsRes.json();
        const doctorsData = await doctorsRes.json();
        setPatientRegistrations(patientsData);
        setDoctorRegistrations(doctorsData);
      } else {
        toast.error('Failed to fetch registrations');
      }
    } catch (error) {
      toast.error('Error fetching registrations');
      console.error('Error:', error);
    }
  };

  const verifyPatient = async (patientId: string) => {
    try {
      // Use relative path for API call since frontend and backend are on the same port
      const response = await fetch(`/api/register/patient/${patientId}/verify`, {
        method: 'PUT'
      });

      if (response.ok) {
        toast.success('Patient verified successfully');
        fetchRegistrations(); // Refresh the list
      } else {
        toast.error('Failed to verify patient');
      }
    } catch (error) {
      toast.error('Error verifying patient');
      console.error('Error:', error);
    }
  };

  const verifyDoctor = async (doctorId: string) => {
    try {
      // Use relative path for API call since frontend and backend are on the same port
      const response = await fetch(`/api/register/doctor/${doctorId}/verify`, {
        method: 'PUT'
      });

      if (response.ok) {
        toast.success('Doctor verified successfully');
        fetchRegistrations(); // Refresh the list
      } else {
        toast.error('Failed to verify doctor');
      }
    } catch (error) {
      toast.error('Error verifying doctor');
      console.error('Error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Stethoscope className="h-8 w-8 text-indigo-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Medical Triage Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              Admin
            </Badge>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Registration Management</h2>
          <p className="text-gray-600">Verify new patient and doctor registrations</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('patients')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'patients'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Patient Registrations ({patientRegistrations.length})
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'doctors'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Doctor Registrations ({doctorRegistrations.length})
            </button>
          </nav>
        </div>

        {/* Patient Registrations */}
        {activeTab === 'patients' && (
          <Card>
            <CardHeader>
              <CardTitle>Patient Registrations</CardTitle>
              <CardDescription>
                Review and verify new patient registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientRegistrations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No patient registrations found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Symptoms</TableHead>
                      <TableHead>Vitals</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientRegistrations.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.patient_id}</TableCell>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell>{patient.contact}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>{patient.symptoms}</TableCell>
                        <TableCell>{patient.vitals}</TableCell>
                        <TableCell>{new Date(patient.registration_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={patient.verified ? "default" : "secondary"}>
                            {patient.verified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!patient.verified ? (
                            <Button 
                              size="sm" 
                              onClick={() => verifyPatient(patient.patient_id)}
                              className="flex items-center bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          ) : (
                            <span className="text-green-600 font-medium">Verified</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Doctor Registrations */}
        {activeTab === 'doctors' && (
          <Card>
            <CardHeader>
              <CardTitle>Doctor Registrations</CardTitle>
              <CardDescription>
                Review and verify new doctor registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {doctorRegistrations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No doctor registrations found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Reference Number</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorRegistrations.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.doctor_id}</TableCell>
                        <TableCell>{doctor.name}</TableCell>
                        <TableCell>{doctor.specialty}</TableCell>
                        <TableCell>{doctor.experience} years</TableCell>
                        <TableCell>{doctor.contact}</TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>{doctor.reference_number}</TableCell>
                        <TableCell>{new Date(doctor.registration_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={doctor.verified ? "default" : "secondary"}>
                            {doctor.verified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!doctor.verified ? (
                            <Button 
                              size="sm" 
                              onClick={() => verifyDoctor(doctor.doctor_id)}
                              className="flex items-center bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          ) : (
                            <span className="text-green-600 font-medium">Verified</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;