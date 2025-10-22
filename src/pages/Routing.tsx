import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SpecialistRoutingChart } from '@/components/Charts/SpecialistRoutingChart';
import { Badge } from '@/components/ui/badge';
import RoutingReport from '@/components/Reports/RoutingReport';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Users, Stethoscope, TrendingUp, Zap, FileText } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  availability_status: string;
  success_rate: number;
  resource_access: number;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  vitals: string;
  severity: number;
  urgency: number;
  resource_need: number;
  waiting_impact: number;
  risk_factor: number;
  triage_score: number;
  assigned_doctor_id: string;
  appointment_time: string;
}

const Routing = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use relative paths for API calls since frontend and backend are on the same port
      const [doctorsRes, patientsRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/patients')
      ]);

      if (doctorsRes.ok && patientsRes.ok) {
        const doctorsData = await doctorsRes.json();
        const patientsData = await patientsRes.json();
        setDoctors(doctorsData);
        setPatients(patientsData);
      } else {
        toast.error('Failed to fetch data');
      }
    } catch (error) {
      toast.error('Error fetching data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (status: string) => {
    if (status === 'Available') return 'bg-green-100 text-green-800';
    if (status === 'Busy') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getWorkloadLevel = (experience: number) => {
    if (experience >= 10) return 'Highly Experienced';
    if (experience >= 5) return 'Experienced';
    return 'Junior';
  };

  const getSpecialistRoutingData = () => {
    const routingData: Record<string, number> = {};
    
    patients.forEach(patient => {
      const doctor = doctors.find(d => d.id === patient.assigned_doctor_id);
      if (doctor) {
        routingData[doctor.name] = (routingData[doctor.name] || 0) + 1;
      }
    });
    
    return routingData;
  };

  const viewReport = () => {
    setShowReport(true);
  };

  const closeReport = () => {
    setShowReport(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Specialist Routing Report</h1>
            <p className="text-gray-600">Comprehensive analysis of specialist assignments</p>
          </div>
          <Button 
            variant="outline" 
            onClick={closeReport}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Routing
          </Button>
        </div>
        
        <RoutingReport doctors={doctors} patients={patients} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Specialist Routing</h1>
          <p className="text-gray-600">Doctor assignment based on WASPAS methodology</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button 
            onClick={viewReport}
            className="flex items-center bg-purple-600 hover:bg-purple-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Report
          </Button>
          <Button 
            onClick={fetchData}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Methodology Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
            AI-Powered Specialist Routing
          </CardTitle>
          <CardDescription>
            Advanced algorithms for optimal doctor-patient matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
                <h4 className="font-medium">WASPAS Methodology</h4>
              </div>
              <p className="text-sm text-gray-600">
                Weighted Aggregated Sum Product Assessment with λ=0.5 parameter for balanced ranking
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                <h4 className="font-medium">Graph Neural Network</h4>
              </div>
              <p className="text-sm text-gray-600">
                Message passing algorithm with η=0.2 influence factor for specialist collaboration modeling
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                <h4 className="font-medium">Cosine Similarity</h4>
              </div>
              <p className="text-sm text-gray-600">
                8-dimensional symptom space matching for precise specialist recommendations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Specialist Workload Distribution</CardTitle>
            <CardDescription>Number of patients assigned to each specialist</CardDescription>
          </CardHeader>
          <CardContent>
            <SpecialistRoutingChart routingData={getSpecialistRoutingData()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Routing Statistics</CardTitle>
            <CardDescription>Key metrics for specialist assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">Total Doctors</p>
                <p className="text-2xl font-bold text-blue-900">{doctors.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">Total Patients</p>
                <p className="text-2xl font-bold text-green-900">{patients.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700">Avg. Experience</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(doctors.reduce((sum, doc) => sum + doc.experience, 0) / doctors.length)} years
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-700">Avg. Success Rate</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.round(doctors.reduce((sum, doc) => sum + (doc.success_rate * 100), 0) / doctors.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Specialists</CardTitle>
            <CardDescription>Available medical specialists</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map(doctor => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.id}</TableCell>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell>{getWorkloadLevel(doctor.experience)}</TableCell>
                    <TableCell>
                      <Badge className={getAvailabilityColor(doctor.availability_status)}>
                        {doctor.availability_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{(doctor.success_rate * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Assignments</CardTitle>
            <CardDescription>Patients assigned to specialists</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Assigned Doctor</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Appointment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map(patient => {
                  const doctor = doctors.find(d => d.id === patient.assigned_doctor_id);
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.id}</TableCell>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{doctor ? doctor.name : 'Unassigned'}</TableCell>
                      <TableCell>{doctor ? doctor.specialty : 'N/A'}</TableCell>
                      <TableCell>{new Date(patient.appointment_time).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Routing;