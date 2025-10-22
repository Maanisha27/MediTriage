import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientForm } from '@/components/Dashboard/PatientForm';
import { TriageResultsTable } from '@/components/Dashboard/TriageResultsTable';
import { TOPSISComparisonChart } from '@/components/Charts/TOPSISComparisonChart';
import { PriorityDistributionChart } from '@/components/Charts/PriorityDistributionChart';
import { AgeSeverityScatterChart } from '@/components/Charts/AgeSeverityScatterChart';
import { SpecialistRoutingChart } from '@/components/Charts/SpecialistRoutingChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  Users, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PatientData,
  TriageResult,
  calculateTOPSIS,
  calculatePROMETHEE,
  fuzzyMamdaniLabel,
  calculateAgeVulnerability,
  calculatePCAWeights,
  calculateWASPAS,
  adjustScoresWithGNN,
  cosineSimilarity,
  aggregateRanks
} from '@/lib/triageAlgorithms';
import { enhancedSpecialistRouting } from '@/lib/enhancedRouting';
import { SAMPLE_PATIENTS, SPECIALISTS, SPECIALIST_SYMPTOM_VECTORS, ADJACENCY_MATRIX, buildPatientSymptomVector } from '@/lib/mockData';
import Navbar from '@/components/Navigation/Navbar';

const Index = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<TriageResult[]>([]);
  const [specialistRouting, setSpecialistRouting] = useState<Record<string, number>>({});

  // Load sample patients on mount
  useEffect(() => {
    loadSamplePatients();
  }, []);

  const loadSamplePatients = () => {
    const samplePatients: PatientData[] = SAMPLE_PATIENTS.map(rec => {
      const [id, age, temp, sev, urg, res, wait, pain, cond] = rec;
      return {
        id: id as string,
        age: age as number,
        temperature: temp as number,
        severity: sev as number,
        urgency: urg as number,
        resourceNeed: res as number,
        waitingImpact: wait as number,
        ageVulnerability: calculateAgeVulnerability(age as number),
        painLevel: pain as number,
        conditionDesc: cond as string,
        registrationTime: new Date()
      };
    });

    runTriage(samplePatients);
    toast.success('Sample patients loaded successfully!', {
      description: `${samplePatients.length} patients added to the system`
    });
  };

  const runTriage = (patientData: PatientData[]) => {
    // Build decision matrix
    const decisionMatrix = patientData.map(p => [
      p.severity,
      p.urgency,
      p.resourceNeed,
      p.waitingImpact,
      p.ageVulnerability
    ]);

    // Calculate weights (PCA if enough patients)
    const weights = calculatePCAWeights(decisionMatrix);

    // Run TOPSIS and PROMETHEE
    const topsisScores = calculateTOPSIS(decisionMatrix, weights);
    const prometheeScores = calculatePROMETHEE(decisionMatrix, weights);

    // Build triage results
    const results: TriageResult[] = patientData.map((p, i) => {
      const topsisScore = topsisScores[i];
      const prometheeScore = prometheeScores[i];
      
      // Determine priority based on TOPSIS
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
      if (topsisScore >= 0.8) priority = 'Critical';
      else if (topsisScore >= 0.6) priority = 'High';
      else if (topsisScore >= 0.4) priority = 'Medium';

      // Fuzzy label
      const fuzzyLabel = fuzzyMamdaniLabel(
        p.severity / 100,
        p.urgency / 100,
        p.waitingImpact / 100
      );

      return {
        ...p,
        topsisScore,
        prometheeScore,
        priority,
        fuzzyLabel
      };
    });

    // Sort by TOPSIS score (descending)
    results.sort((a, b) => b.topsisScore - a.topsisScore);

    setPatients(results);

    // Calculate specialist routing for all patients
    calculateSpecialistRouting(results);
  };

  const calculateSpecialistRouting = (triageResults: TriageResult[]) => {
    const routing: Record<string, number> = {};

    triageResults.forEach(patient => {
      const symptomVector = buildPatientSymptomVector(
        patient.conditionDesc,
        patient.severity,
        patient.urgency,
        patient.painLevel,
        patient.age
      );

      // Use enhanced specialist routing
      const routingResult = enhancedSpecialistRouting(
        patient.id,
        symptomVector,
        patient.severity,
        patient.urgency,
        SPECIALISTS
      );

      // Assign to top specialist if available
      if (routingResult.recommendations.length > 0) {
        const topSpecialist = routingResult.recommendations[0];
        const specialist = SPECIALISTS.find(s => s.id === topSpecialist.specialistId);
        if (specialist) {
          routing[specialist.label] = (routing[specialist.label] || 0) + 1;
        }
      }
    });

    setSpecialistRouting(routing);
  };

  const handleAddPatient = (patient: PatientData) => {
    patient.ageVulnerability = calculateAgeVulnerability(patient.age);
    const updatedPatients = [...patients, patient as TriageResult];
    runTriage(updatedPatients);
    toast.success('Patient added successfully!', {
      description: `${patient.id} has been triaged`
    });
  };

  const handleSelectPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      toast.info(`Patient ${patient.id}`, {
        description: `Priority: ${patient.priority} | TOPSIS: ${patient.topsisScore.toFixed(3)}`
      });
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['ID', 'Age', 'Condition', 'Severity', 'Urgency', 'TOPSIS', 'PROMETHEE', 'Priority', 'Fuzzy Label'],
      ...patients.map(p => [
        p.id,
        p.age,
        p.conditionDesc,
        p.severity,
        p.urgency,
        p.topsisScore.toFixed(3),
        p.prometheeScore.toFixed(4),
        p.priority,
        p.fuzzyLabel
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('CSV exported successfully!');
  };

  const handleClearAll = () => {
    setPatients([]);
    setSpecialistRouting({});
    toast.info('All patient data cleared');
  };

  const criticalCount = patients.filter(p => p.priority === 'Critical').length;
  const avgTriageTime = '< 2 min';
  const triageAccuracy = '90%';

  // Get top 3 patients by priority
  const topPatients = patients.slice(0, 3);
  
  // Get top 3 specialists by patient count
  const topSpecialists = Object.entries(specialistRouting)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Triage Dashboard</h1>
            <p className="text-gray-600">AI-powered emergency decision making system</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => navigate('/triage')}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700"
              title="View detailed patient triage analysis using TOPSIS algorithm"
            >
              <Activity className="h-4 w-4 mr-2" />
              View Triage
            </Button>
            <Button 
              onClick={() => navigate('/routing')}
              className="flex items-center bg-purple-600 hover:bg-purple-700"
              title="View specialist routing and assignments using WASPAS methodology"
            >
              <Users className="h-4 w-4 mr-2" />
              View Routing
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground">Patients in system</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Triage Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgTriageTime}</div>
              <p className="text-xs text-muted-foreground">Processing speed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{triageAccuracy}</div>
              <p className="text-xs text-muted-foreground">System performance</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={loadSamplePatients}
            variant="outline"
            className="bg-primary/10 hover:bg-primary/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Load Sample Data
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={patients.length === 0}
            className="bg-success/10 hover:bg-success/20"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={handleClearAll}
            variant="outline"
            disabled={patients.length === 0}
            className="bg-destructive/10 hover:bg-destructive/20"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Top Priority Patients
              </CardTitle>
              <CardDescription>
                Patients requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topPatients.length > 0 ? (
                <div className="space-y-3">
                  {topPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{patient.id}</div>
                        <div className="text-sm text-gray-500">{patient.conditionDesc}</div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={
                            patient.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            patient.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            patient.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }
                        >
                          {patient.priority}
                        </Badge>
                        <div className="text-sm font-medium">{patient.topsisScore.toFixed(3)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No patients in system
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="h-5 w-5 mr-2 text-purple-500" />
                Top Specialists
              </CardTitle>
              <CardDescription>
                Specialists with highest patient assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topSpecialists.length > 0 ? (
                <div className="space-y-3">
                  {topSpecialists.map(([specialist, count]) => (
                    <div key={specialist} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="font-medium">{specialist}</div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="font-medium">{count} patients</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No specialist assignments
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient Input Form */}
        <div className="mb-8">
          <PatientForm onAddPatient={handleAddPatient} />
        </div>

        {/* Triage Results Table */}
        <div className="mb-8">
          <TriageResultsTable results={patients} onSelectPatient={handleSelectPatient} />
        </div>

        {/* Analytics Charts */}
        {patients.length > 0 && (
          <div className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <TOPSISComparisonChart results={patients} />
              <PriorityDistributionChart results={patients} />
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <AgeSeverityScatterChart results={patients} />
              <SpecialistRoutingChart routingData={specialistRouting} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;