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
  Cell
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import {
  calculateTOPSIS,
  calculatePCAWeights,
  calculatePROMETHEE,
  calculateAgeVulnerability
} from '@/lib/triageAlgorithms';

interface PatientData {
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
  conditionDesc?: string;
  painLevel?: number;
  ageVulnerability?: number;
}

interface TriageAnalysis {
  patientId: string;
  patientName: string;
  topsisScore: number;
  prometheeScore: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  weights: number[];
  decisionMatrix: number[][];
  idealSolutions: {
    positive: number[];
    negative: number[];
  };
  distances: {
    positive: number;
    negative: number;
  };
}

const TriageReport = ({ patients }: { patients: PatientData[] }) => {
  const [triageAnalysis, setTriageAnalysis] = useState<TriageAnalysis[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalPatients: 0,
    criticalCases: 0,
    highCases: 0,
    mediumCases: 0,
    lowCases: 0,
    avgTopsisScore: 0,
    avgPrometheeScore: 0
  });
  const [criteriaDistribution, setCriteriaDistribution] = useState<any[]>([]);
  const [priorityDistribution, setPriorityDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (patients.length > 0) {
      analyzeTriageData();
      calculateOverallStats();
      prepareChartData();
    }
  }, [patients]);

  const analyzeTriageData = () => {
    const analysis: TriageAnalysis[] = patients.map(patient => {
      // Build decision matrix for this patient
      const decisionMatrix = [[
        patient.severity,
        patient.urgency,
        patient.resource_need,
        patient.waiting_impact,
        patient.risk_factor * 100 // Convert back to percentage
      ]];
      
      // Calculate weights using PCA
      const weights = calculatePCAWeights(decisionMatrix);
      
      // Calculate TOPSIS
      const topsisScores = calculateTOPSIS(decisionMatrix, weights);
      
      // Calculate PROMETHEE
      const prometheeScores = calculatePROMETHEE(decisionMatrix, weights);
      
      // Determine priority
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
      if (topsisScores[0] >= 0.8) priority = 'Critical';
      else if (topsisScores[0] >= 0.6) priority = 'High';
      else if (topsisScores[0] >= 0.4) priority = 'Medium';
      
      // Calculate ideal solutions
      const normalized = decisionMatrix.map(row => 
        row.map((val, j) => {
          const col = decisionMatrix.map(r => r[j]);
          const norm = Math.sqrt(col.reduce((sum, v) => sum + v * v, 0));
          return val / (norm || 1);
        })
      );
      
      const weighted = normalized.map(row => 
        row.map((val, j) => val * weights[j])
      );
      
      const ideal = weighted[0].map((_, j) => {
        const col = weighted.map(row => row[j]);
        return Math.max(...col);
      });
      
      const antiIdeal = weighted[0].map((_, j) => {
        const col = weighted.map(row => row[j]);
        return Math.min(...col);
      });
      
      // Calculate distances
      const dPlus = Math.sqrt(weighted[0].reduce((sum, val, j) => sum + Math.pow(val - ideal[j], 2), 0));
      const dMinus = Math.sqrt(weighted[0].reduce((sum, val, j) => sum + Math.pow(val - antiIdeal[j], 2), 0));
      
      return {
        patientId: patient.id,
        patientName: patient.name,
        topsisScore: topsisScores[0],
        prometheeScore: prometheeScores[0],
        priority,
        weights,
        decisionMatrix,
        idealSolutions: {
          positive: ideal,
          negative: antiIdeal
        },
        distances: {
          positive: dPlus,
          negative: dMinus
        }
      };
    });
    
    setTriageAnalysis(analysis);
  };

  const calculateOverallStats = () => {
    const total = patients.length;
    const critical = patients.filter(p => p.triage_score >= 0.8).length;
    const high = patients.filter(p => p.triage_score >= 0.6 && p.triage_score < 0.8).length;
    const medium = patients.filter(p => p.triage_score >= 0.4 && p.triage_score < 0.6).length;
    const low = patients.filter(p => p.triage_score < 0.4).length;
    
    const avgTopsis = patients.reduce((sum, p) => sum + p.triage_score, 0) / total;
    const avgPromethee = 0; // Placeholder since we don't have individual PROMETHEE scores in the data
    
    setOverallStats({
      totalPatients: total,
      criticalCases: critical,
      highCases: high,
      mediumCases: medium,
      lowCases: low,
      avgTopsisScore: parseFloat(avgTopsis.toFixed(4)),
      avgPrometheeScore: parseFloat(avgPromethee.toFixed(4))
    });
  };

  const prepareChartData = () => {
    // Criteria distribution
    const criteriaData = [
      { name: 'Severity', avg: patients.reduce((sum, p) => sum + p.severity, 0) / patients.length },
      { name: 'Urgency', avg: patients.reduce((sum, p) => sum + p.urgency, 0) / patients.length },
      { name: 'Resource Need', avg: patients.reduce((sum, p) => sum + p.resource_need, 0) / patients.length },
      { name: 'Waiting Impact', avg: patients.reduce((sum, p) => sum + p.waiting_impact, 0) / patients.length },
      { name: 'Age Vulnerability', avg: patients.reduce((sum, p) => sum + (p.risk_factor * 100), 0) / patients.length }
    ];
    
    setCriteriaDistribution(criteriaData);
    
    // Priority distribution
    const priorityData = [
      { name: 'Critical', value: patients.filter(p => p.triage_score >= 0.8).length, color: '#ef4444' },
      { name: 'High', value: patients.filter(p => p.triage_score >= 0.6 && p.triage_score < 0.8).length, color: '#f97316' },
      { name: 'Medium', value: patients.filter(p => p.triage_score >= 0.4 && p.triage_score < 0.6).length, color: '#eab308' },
      { name: 'Low', value: patients.filter(p => p.triage_score < 0.4).length, color: '#22c55e' }
    ];
    
    setPriorityDistribution(priorityData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No patient data available for triage report</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalPatients}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.criticalCases}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overallStats.highCases}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overallStats.mediumCases}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Priority</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.lowCases}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. TOPSIS</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overallStats.avgTopsisScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Patient distribution by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Criteria Averages</CardTitle>
            <CardDescription>Average scores across all patients</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={criteriaDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg" fill="#8884d8" name="Average Score">
                  {criteriaDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      index === 0 ? '#ff6b6b' :
                      index === 1 ? '#4ecdc4' :
                      index === 2 ? '#45b7d1' :
                      index === 3 ? '#96ceb4' :
                      '#feca57'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Triage Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-indigo-600" />
            Detailed Triage Analysis
          </CardTitle>
          <CardDescription>
            Individual patient triage scores and methodology breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>TOPSIS Score</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Resource Need</TableHead>
                  <TableHead>Waiting Impact</TableHead>
                  <TableHead>Age Vuln.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.id}</TableCell>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell className="font-medium">{patient.triage_score.toFixed(4)}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(
                        patient.triage_score >= 0.8 ? 'Critical' :
                        patient.triage_score >= 0.6 ? 'High' :
                        patient.triage_score >= 0.4 ? 'Medium' : 'Low'
                      )}>
                        {patient.triage_score >= 0.8 ? 'Critical' :
                         patient.triage_score >= 0.6 ? 'High' :
                         patient.triage_score >= 0.4 ? 'Medium' : 'Low'}
                      </Badge>
                    </TableCell>
                    <TableCell>{patient.severity}%</TableCell>
                    <TableCell>{patient.urgency}%</TableCell>
                    <TableCell>{patient.resource_need}%</TableCell>
                    <TableCell>{patient.waiting_impact}%</TableCell>
                    <TableCell>{(patient.risk_factor * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
            Triage Methodology
          </CardTitle>
          <CardDescription>
            Detailed explanation of the TOPSIS algorithm with PCA-based weight calculation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">TOPSIS Algorithm</h3>
              <p className="text-sm text-gray-600 mb-3">
                The Technique for Order Preference by Similarity to Ideal Solution (TOPSIS) is used to rank patients based on multiple criteria.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Normalize the decision matrix using vector normalization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Apply weights to normalized values (calculated using PCA)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Determine positive and negative ideal solutions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Calculate Euclidean distances to ideal solutions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Compute relative closeness to ideal solution: C_i = D_i- / (D_i+ + D_i-)</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">PCA-Based Weight Calculation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Principal Component Analysis (PCA) is used to dynamically calculate weights for each criterion based on variance in the data.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Calculate variance for each criterion across all patients</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Use square root of variance (standard deviation) as weight</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Normalize weights to sum to 1</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Apply weights to ensure more variable criteria have higher influence</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Five Evaluation Criteria</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-white rounded border">
                <div className="font-medium">Medical Severity</div>
                <div className="text-sm text-gray-600">Condition seriousness</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="font-medium">Time Urgency</div>
                <div className="text-sm text-gray-600">Treatment time sensitivity</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="font-medium">Resource Requirements</div>
                <div className="text-sm text-gray-600">Medical resources needed</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="font-medium">Impact of Waiting</div>
                <div className="text-sm text-gray-600">Risk of delayed treatment</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="font-medium">Age Vulnerability</div>
                <div className="text-sm text-gray-600">Age-related risk factors</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TriageReport;