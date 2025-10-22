import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  Users, 
  Stethoscope, 
  TrendingUp, 
  Zap,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react';
import { enhancedSpecialistRouting } from '@/lib/enhancedRouting';
import { SPECIALISTS, buildPatientSymptomVector } from '@/lib/mockData';

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

interface RoutingAnalysis {
  patientId: string;
  patientName: string;
  recommendations: Array<{
    specialistId: string;
    specialistName: string;
    specialistSpecialty: string;
    confidenceScore: number;
    estimatedWaitTime: number;
    requiredResources: string[];
    rank: number;
    waspasScore: number;
    gnnScore: number;
    similarityScore: number;
  }>;
  decisionPath: {
    waspasScores: Record<string, number>;
    gnnScores: Record<string, number>;
    similarityScores: Record<string, number>;
    finalScores: Record<string, number>;
  };
}

const RoutingReport = ({ doctors, patients }: { doctors: Doctor[]; patients: Patient[] }) => {
  const [routingAnalysis, setRoutingAnalysis] = useState<RoutingAnalysis[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalAssignments: 0,
    avgConfidence: 0,
    avgWaitTime: 0,
    specialistUtilization: 0
  });
  const [specialistPerformance, setSpecialistPerformance] = useState<any[]>([]);
  const [assignmentDistribution, setAssignmentDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (doctors.length > 0 && patients.length > 0) {
      analyzeRoutingData();
      calculateOverallStats();
      prepareChartData();
    }
  }, [doctors, patients]);

  const analyzeRoutingData = () => {
    const analysis: RoutingAnalysis[] = patients.map(patient => {
      // Build symptom vector for this patient
      const symptomVector = buildPatientSymptomVector(
        patient.symptoms,
        patient.severity,
        patient.urgency,
        5, // Default pain level
        patient.age
      );
      
      // Get routing recommendations
      const routingResult = enhancedSpecialistRouting(
        patient.id,
        symptomVector,
        patient.severity,
        patient.urgency,
        SPECIALISTS
      );
      
      // Enhance recommendations with individual scores
      const enhancedRecommendations = routingResult.recommendations.map(rec => ({
        ...rec,
        waspasScore: routingResult.decisionPath.waspasScores[rec.specialistId] || 0,
        gnnScore: routingResult.decisionPath.gnnScores[rec.specialistId] || 0,
        similarityScore: routingResult.decisionPath.similarityScores[rec.specialistId] || 0
      }));
      
      return {
        patientId: patient.id,
        patientName: patient.name,
        recommendations: enhancedRecommendations,
        decisionPath: routingResult.decisionPath
      };
    });
    
    setRoutingAnalysis(analysis);
  };

  const calculateOverallStats = () => {
    const totalAssignments = patients.filter(p => p.assigned_doctor_id).length;
    const assignedPatients = patients.filter(p => p.assigned_doctor_id);
    
    const avgConfidence = assignedPatients.length > 0 
      ? assignedPatients.reduce((sum, p) => sum + p.triage_score, 0) / assignedPatients.length
      : 0;
      
    const avgWaitTime = assignedPatients.length > 0
      ? assignedPatients.reduce((sum, p) => sum + 30, 0) / assignedPatients.length // Placeholder
      : 0;
      
    const specialistUtilization = doctors.length > 0
      ? (assignedPatients.length / doctors.length)
      : 0;
    
    setOverallStats({
      totalAssignments,
      avgConfidence: parseFloat(avgConfidence.toFixed(4)),
      avgWaitTime: parseFloat(avgWaitTime.toFixed(1)),
      specialistUtilization: parseFloat(specialistUtilization.toFixed(2))
    });
  };

  const prepareChartData = () => {
    // Specialist performance based on success rates and assignments
    const performanceData = doctors.map(doctor => {
      const assignments = patients.filter(p => p.assigned_doctor_id === doctor.id).length;
      return {
        name: doctor.name,
        specialty: doctor.specialty,
        successRate: doctor.success_rate * 100,
        assignments,
        experience: doctor.experience
      };
    });
    
    setSpecialistPerformance(performanceData);
    
    // Assignment distribution by specialty
    const specialtyCounts: Record<string, number> = {};
    patients.forEach(patient => {
      const doctor = doctors.find(d => d.id === patient.assigned_doctor_id);
      if (doctor) {
        specialtyCounts[doctor.specialty] = (specialtyCounts[doctor.specialty] || 0) + 1;
      }
    });
    
    const distributionData = Object.entries(specialtyCounts).map(([specialty, count]) => ({
      name: specialty,
      value: count
    }));
    
    setAssignmentDistribution(distributionData);
  };

  const getAvailabilityColor = (status: string) => {
    if (status === 'Available') return 'bg-green-100 text-green-800';
    if (status === 'Busy') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-blue-100 text-blue-800';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (doctors.length === 0 || patients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No data available for routing report</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Patient-doctor assignments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overallStats.avgConfidence}</div>
            <p className="text-xs text-muted-foreground">Average match confidence</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{overallStats.avgWaitTime} min</div>
            <p className="text-xs text-muted-foreground">Estimated waiting time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Specialist Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.specialistUtilization}</div>
            <p className="text-xs text-muted-foreground">Patients per specialist</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Specialist Performance</CardTitle>
            <CardDescription>Success rates and assignment counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={specialistPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successRate" fill="#8884d8" name="Success Rate (%)" />
                <Bar dataKey="assignments" fill="#82ca9d" name="Assignments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Assignment Distribution</CardTitle>
            <CardDescription>Distribution by medical specialty</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assignmentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {assignmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      index === 0 ? '#ff6b6b' :
                      index === 1 ? '#4ecdc4' :
                      index === 2 ? '#45b7d1' :
                      index === 3 ? '#96ceb4' :
                      index === 4 ? '#feca57' :
                      '#a68cf5'
                    } />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Specialist Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
            Specialist Details
          </CardTitle>
          <CardDescription>
            Information about available medical specialists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Resource Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.id}</TableCell>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell>{doctor.experience} years</TableCell>
                    <TableCell>
                      <Badge className={getAvailabilityColor(doctor.availability_status)}>
                        {doctor.availability_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{(doctor.success_rate * 100).toFixed(1)}%</TableCell>
                    <TableCell>{doctor.resource_access}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Routing Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-indigo-600" />
            Detailed Routing Analysis
          </CardTitle>
          <CardDescription>
            Patient-specific specialist recommendations and scoring breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {routingAnalysis.slice(0, 5).map((analysis) => (
              <div key={analysis.patientId} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-medium">{analysis.patientName} ({analysis.patientId})</h3>
                    <p className="text-sm text-gray-600">Top 3 specialist recommendations</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Specialist</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>WASPAS</TableHead>
                        <TableHead>GNN</TableHead>
                        <TableHead>Similarity</TableHead>
                        <TableHead>Wait Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.recommendations.slice(0, 3).map((rec) => (
                        <TableRow key={`${analysis.patientId}-${rec.specialistId}`}>
                          <TableCell className="font-medium">#{rec.rank}</TableCell>
                          <TableCell>{rec.specialistName}</TableCell>
                          <TableCell>{rec.specialistSpecialty}</TableCell>
                          <TableCell>
                            <Badge className={getConfidenceColor(rec.confidenceScore)}>
                              {(rec.confidenceScore * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>{rec.waspasScore.toFixed(4)}</TableCell>
                          <TableCell>{rec.gnnScore.toFixed(4)}</TableCell>
                          <TableCell>{rec.similarityScore.toFixed(4)}</TableCell>
                          <TableCell>{rec.estimatedWaitTime} min</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Required Resources:</strong> {analysis.recommendations[0]?.requiredResources.join(', ') || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Methodology Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
            Routing Methodology
          </CardTitle>
          <CardDescription>
            Detailed explanation of the specialist routing algorithms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                WASPAS Methodology
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Weighted Aggregated Sum Product Assessment with λ=0.5 parameter.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Combines WSM and WPM methods for balanced ranking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>λ=0.5 provides equal weight to both methods</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Evaluates specialists on 5 criteria: expertise, availability, success rate, resource access, workload</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                Graph Neural Network
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Message passing algorithm with η=0.2 influence factor.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Models collaboration between specialists</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>η=0.2 controls influence of neighboring specialists</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Adjusts scores based on specialist network</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Cosine Similarity
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                8-dimensional symptom space matching.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Compares patient symptoms with specialist expertise</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>8-dimensional space: cardiac, neurology, trauma, metabolic, severity, urgency, pain, age</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Higher similarity = better match</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Decision Fusion</h3>
            <p className="text-sm text-gray-600 mb-3">
              Weighted rank aggregation combines all three methods:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="font-medium text-purple-600">WASPAS</div>
                <div className="text-sm text-gray-600">50% weight</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="font-medium text-blue-600">GNN</div>
                <div className="text-sm text-gray-600">30% weight</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="font-medium text-green-600">Similarity</div>
                <div className="text-sm text-gray-600">20% weight</div>
              </div>
            </div>
            <div className="mt-3 text-center text-sm font-medium">
              Final Score = 0.5×WASPAS + 0.3×GNN + 0.2×Similarity
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutingReport;