import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PriorityDistributionChart } from '@/components/Charts/PriorityDistributionChart';
import { AgeSeverityScatterChart } from '@/components/Charts/AgeSeverityScatterChart';
import TriageRoutingDetails from '@/components/TriageRoutingDetails';
import TriageReport from '@/components/Reports/TriageReport';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Info, FileText } from 'lucide-react';

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

const Triage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTriageDetails, setShowTriageDetails] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Use relative path for API call since frontend and backend are on the same port
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        // Sort by triage score descending
        const sortedData = data.sort((a: Patient, b: Patient) => b.triage_score - a.triage_score);
        setPatients(sortedData);
      } else {
        toast.error('Failed to fetch patients');
      }
    } catch (error) {
      toast.error('Error fetching patients');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 0.9) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 0.7) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 0.9) return 'Critical';
    if (score >= 0.7) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  const viewPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetails(true);
  };

  const viewTriageDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowTriageDetails(true);
  };

  const viewReport = () => {
    setShowReport(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setShowTriageDetails(false);
    setShowReport(false);
    setSelectedPatient(null);
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
            <h1 className="text-3xl font-bold text-gray-900">Triage Report</h1>
            <p className="text-gray-600">Comprehensive analysis of patient triage</p>
          </div>
          <Button 
            variant="outline" 
            onClick={closeDetails}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Triage
          </Button>
        </div>
        
        <TriageReport patients={patients} />
      </div>
    );
  }

  if (showTriageDetails && selectedPatient) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Triage & Routing Details</h1>
            <p className="text-gray-600">Comprehensive analysis for {selectedPatient.name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={closeDetails}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Triage
          </Button>
        </div>
        
        <TriageRoutingDetails patient={selectedPatient} />
      </div>
    );
  }

  if (showDetails && selectedPatient) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
            <p className="text-gray-600">Detailed information for {selectedPatient.name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={closeDetails}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Triage
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Basic patient details and triage score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-medium">{selectedPatient.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedPatient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{selectedPatient.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">{selectedPatient.gender}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Triage Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Triage Score:</span>
                    <span className="font-medium">{selectedPatient.triage_score.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <Badge className={getPriorityColor(selectedPatient.triage_score)}>
                      {getPriorityLabel(selectedPatient.triage_score)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Severity:</span>
                    <span className="font-medium">{selectedPatient.severity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Urgency:</span>
                    <span className="font-medium">{selectedPatient.urgency}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <CardDescription>Symptoms, vitals, and risk factors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Symptoms</h3>
                <p className="text-gray-700">{selectedPatient.symptoms}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Vital Signs</h3>
                <p className="text-gray-700">{selectedPatient.vitals}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Risk Factors</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Factor:</span>
                    <span className="font-medium">{selectedPatient.risk_factor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resource Need:</span>
                    <span className="font-medium">{selectedPatient.resource_need}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waiting Impact:</span>
                    <span className="font-medium">{selectedPatient.waiting_impact}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Triage Dashboard</h1>
          <p className="text-gray-600">Patient prioritization based on TOPSIS algorithm</p>
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
            className="flex items-center bg-indigo-600 hover:bg-indigo-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Report
          </Button>
          <Button 
            onClick={fetchPatients}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Patients categorized by triage priority</CardDescription>
          </CardHeader>
          <CardContent>
            <PriorityDistributionChart results={patients.map(p => ({
              id: p.id,
              age: p.age,
              temperature: 37,
              severity: p.severity,
              urgency: p.urgency,
              resourceNeed: p.resource_need,
              waitingImpact: p.waiting_impact,
              ageVulnerability: p.risk_factor * 100,
              painLevel: 5,
              conditionDesc: p.symptoms,
              registrationTime: new Date(),
              topsisScore: p.triage_score,
              prometheeScore: 0,
              priority: getPriorityLabel(p.triage_score) as 'Critical' | 'High' | 'Medium' | 'Low',
              fuzzyLabel: ''
            }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age vs Severity</CardTitle>
            <CardDescription>Scatter plot showing correlation between age and severity</CardDescription>
          </CardHeader>
          <CardContent>
            <AgeSeverityScatterChart results={patients.map(p => ({
              id: p.id,
              age: p.age,
              temperature: 37,
              severity: p.severity,
              urgency: p.urgency,
              resourceNeed: p.resource_need,
              waitingImpact: p.waiting_impact,
              ageVulnerability: p.risk_factor * 100,
              painLevel: 5,
              conditionDesc: p.symptoms,
              registrationTime: new Date(),
              topsisScore: p.triage_score,
              prometheeScore: 0,
              priority: 'Low',
              fuzzyLabel: ''
            }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Priority Ranking</CardTitle>
          <CardDescription>Patients ranked by triage score (highest priority first)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Triage Score</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient, index) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{patient.id}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.severity}%</TableCell>
                  <TableCell>{patient.urgency}%</TableCell>
                  <TableCell className="font-medium">{patient.triage_score.toFixed(3)}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(patient.triage_score)}>
                      {getPriorityLabel(patient.triage_score)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => viewPatientDetails(patient)}
                      >
                        Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => viewTriageDetails(patient)}
                        className="flex items-center"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Full Analysis
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Triage;