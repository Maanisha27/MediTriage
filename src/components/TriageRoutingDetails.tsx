import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  Users, 
  BarChart3, 
  Clock, 
  Stethoscope, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { 
  calculateTOPSIS, 
  calculatePCAWeights, 
  calculatePROMETHEE,
  fuzzyMamdaniLabel,
  calculateAgeVulnerability
} from '@/lib/triageAlgorithms';
import { enhancedSpecialistRouting } from '@/lib/enhancedRouting';
import { SPECIALISTS, buildPatientSymptomVector } from '@/lib/mockData';

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
}

interface TriageDetails {
  topsisScore: number;
  prometheeScore: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  fuzzyLabel: string;
  weights: number[];
  criteriaScores: {
    severity: number;
    urgency: number;
    resourceNeed: number;
    waitingImpact: number;
    ageVulnerability: number;
  };
}

interface RoutingDetails {
  recommendations: Array<{
    specialistId: string;
    specialistName: string;
    specialistSpecialty: string;
    confidenceScore: number;
    estimatedWaitTime: number;
    requiredResources: string[];
    rank: number;
  }>;
  decisionPath: {
    waspasScores: Record<string, number>;
    gnnScores: Record<string, number>;
    similarityScores: Record<string, number>;
    finalScores: Record<string, number>;
  };
}

const TriageRoutingDetails = ({ patient }: { patient: PatientData }) => {
  const [triageDetails, setTriageDetails] = useState<TriageDetails | null>(null);
  const [routingDetails, setRoutingDetails] = useState<RoutingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateTriageAndRouting();
  }, [patient]);

  const calculateTriageAndRouting = () => {
    setLoading(true);
    
    // Calculate triage details
    const decisionMatrix = [[
      patient.severity,
      patient.urgency,
      patient.resource_need,
      patient.waiting_impact,
      patient.risk_factor * 100
    ]];
    
    const weights = calculatePCAWeights(decisionMatrix);
    const topsisScores = calculateTOPSIS(decisionMatrix, weights);
    const prometheeScores = calculatePROMETHEE(decisionMatrix, weights);
    const fuzzyLabel = fuzzyMamdaniLabel(
      patient.severity / 100,
      patient.urgency / 100,
      patient.waiting_impact / 100
    );
    
    // Determine priority based on TOPSIS
    let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    if (topsisScores[0] >= 0.8) priority = 'Critical';
    else if (topsisScores[0] >= 0.6) priority = 'High';
    else if (topsisScores[0] >= 0.4) priority = 'Medium';
    
    const triageInfo: TriageDetails = {
      topsisScore: topsisScores[0],
      prometheeScore: prometheeScores[0],
      priority,
      fuzzyLabel,
      weights,
      criteriaScores: {
        severity: patient.severity,
        urgency: patient.urgency,
        resourceNeed: patient.resource_need,
        waitingImpact: patient.waiting_impact,
        ageVulnerability: patient.risk_factor * 100
      }
    };
    
    // Calculate routing details
    const symptomVector = buildPatientSymptomVector(
      patient.symptoms,
      patient.severity,
      patient.urgency,
      5, // Default pain level
      patient.age
    );
    
    const routingResult = enhancedSpecialistRouting(
      patient.id,
      symptomVector,
      patient.severity,
      patient.urgency,
      SPECIALISTS
    );
    
    const routingInfo: RoutingDetails = {
      recommendations: routingResult.recommendations,
      decisionPath: routingResult.decisionPath
    };
    
    setTriageDetails(triageInfo);
    setRoutingDetails(routingInfo);
    setLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-blue-100 text-blue-800';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Triage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-indigo-600" />
            Triage Analysis
          </CardTitle>
          <CardDescription>
            Patient prioritization based on TOPSIS algorithm with PCA-based dynamic weights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Triage Scores</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">TOPSIS Score</span>
                  <span className="text-lg font-bold">{triageDetails?.topsisScore.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">PROMETHEE Score</span>
                  <span className="text-lg font-bold">{triageDetails?.prometheeScore.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Priority Level</span>
                  <Badge className={`${getPriorityColor(triageDetails?.priority || 'Low')} text-sm py-1 px-2`}>
                    {triageDetails?.priority}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Fuzzy Label</span>
                  <span className="text-sm font-medium">{triageDetails?.fuzzyLabel}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Criteria Weights (PCA)</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Medical Severity</span>
                  <span className="font-medium">{(triageDetails?.weights[0] || 0).toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time Urgency</span>
                  <span className="font-medium">{(triageDetails?.weights[1] || 0).toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Resource Requirements</span>
                  <span className="font-medium">{(triageDetails?.weights[2] || 0).toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impact of Waiting</span>
                  <span className="font-medium">{(triageDetails?.weights[3] || 0).toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Age Vulnerability</span>
                  <span className="font-medium">{(triageDetails?.weights[4] || 0).toFixed(3)}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-4 mb-3">Criteria Scores</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Severity</span>
                  <span className="font-medium">{triageDetails?.criteriaScores.severity}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Urgency</span>
                  <span className="font-medium">{triageDetails?.criteriaScores.urgency}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Resource Need</span>
                  <span className="font-medium">{triageDetails?.criteriaScores.resourceNeed}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Waiting Impact</span>
                  <span className="font-medium">{triageDetails?.criteriaScores.waitingImpact}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Age Vulnerability</span>
                  <span className="font-medium">{triageDetails?.criteriaScores.ageVulnerability.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specialist Routing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Specialist Routing
          </CardTitle>
          <CardDescription>
            Doctor assignment based on WASPAS (λ=0.5), GNN (η=0.2), and cosine similarity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routingDetails?.recommendations.length ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Top Recommendations</h3>
                <div className="space-y-3">
                  {routingDetails.recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.specialistId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <Stethoscope className="h-4 w-4 mr-2 text-purple-600" />
                            <span className="font-medium">{rec.specialistName}</span>
                            <Badge variant="secondary" className="ml-2">
                              {rec.specialistSpecialty}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Confidence: {(rec.confidenceScore * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            {rec.estimatedWaitTime} min
                          </div>
                          <Badge className={`${getConfidenceColor(rec.confidenceScore)} mt-1 text-xs`}>
                            Rank #{rec.rank}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Required Resources:</div>
                        <div className="flex flex-wrap gap-1">
                          {rec.requiredResources.map((resource, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Decision Path Analysis</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Specialist</TableHead>
                        <TableHead>WASPAS</TableHead>
                        <TableHead>GNN</TableHead>
                        <TableHead>Similarity</TableHead>
                        <TableHead>Final Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(routingDetails.decisionPath.finalScores)
                        .sort((a, b) => b[1] - a[1])
                        .map(([specialistId, finalScore]) => {
                          const specialist = SPECIALISTS.find(s => s.id === specialistId);
                          return (
                            <TableRow key={specialistId}>
                              <TableCell className="font-medium">
                                {specialist?.label || specialistId}
                              </TableCell>
                              <TableCell>
                                {(routingDetails.decisionPath.waspasScores[specialistId] || 0).toFixed(4)}
                              </TableCell>
                              <TableCell>
                                {(routingDetails.decisionPath.gnnScores[specialistId] || 0).toFixed(4)}
                              </TableCell>
                              <TableCell>
                                {(routingDetails.decisionPath.similarityScores[specialistId] || 0).toFixed(4)}
                              </TableCell>
                              <TableCell className="font-bold">
                                {finalScore.toFixed(4)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No specialist recommendations available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Methodology Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Methodology Summary
          </CardTitle>
          <CardDescription>
            AI-powered decision making processes used in this system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                <h4 className="font-medium">Intelligent Triage</h4>
              </div>
              <p className="text-sm text-gray-600">
                TOPSIS algorithm with PCA-based dynamic weight calculation evaluating patients on 5 criteria
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Zap className="h-5 w-5 mr-2 text-purple-600" />
                <h4 className="font-medium">Specialist Routing</h4>
              </div>
              <p className="text-sm text-gray-600">
                WASPAS (λ=0.5), GNN (η=0.2), and cosine similarity in 8-dimensional symptom space
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                <h4 className="font-medium">Decision Fusion</h4>
              </div>
              <p className="text-sm text-gray-600">
                Weighted rank aggregation: 0.5×WASPAS + 0.3×GNN + 0.2×Similarity
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TriageRoutingDetails;