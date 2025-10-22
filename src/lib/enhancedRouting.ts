// Enhanced specialist routing with validation and load balancing

import {
  Specialist,
  calculateWASPAS,
  adjustScoresWithGNN,
  cosineSimilarity,
  aggregateRanks
} from './triageAlgorithms';
import { SPECIALIST_SYMPTOM_VECTORS, ADJACENCY_MATRIX } from './mockData';

export interface EnhancedRoutingResult {
  patientId: string;
  recommendations: Array<{
    specialistId: string;
    specialistName: string;
    specialistSpecialty: string;
    confidenceScore: number;
    estimatedWaitTime: number; // in minutes
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

/**
 * Enhanced specialist routing that validates against live availability and includes load balancing
 */
export function enhancedSpecialistRouting(
  patientId: string,
  patientSymptomVector: number[],
  patientSeverity: number,
  patientUrgency: number,
  specialists: Specialist[]
): EnhancedRoutingResult {
  // Filter out unavailable specialists
  const availableSpecialists = specialists.filter(s => s.availability > 0);
  
  if (availableSpecialists.length === 0) {
    return {
      patientId,
      recommendations: [],
      decisionPath: {
        waspasScores: {},
        gnnScores: {},
        similarityScores: {},
        finalScores: {}
      }
    };
  }

  // WASPAS scores
  const { ids, scores: waspasScores } = calculateWASPAS(availableSpecialists);

  // GNN adjustment
  const availVector = availableSpecialists.map(s => s.availability / 100);
  const gnnScores = adjustScoresWithGNN(waspasScores, availVector, ADJACENCY_MATRIX);

  // Similarity scores
  const simScores = availableSpecialists.map(s => 
    cosineSimilarity(patientSymptomVector, SPECIALIST_SYMPTOM_VECTORS[s.id])
  );

  // Aggregate ranks
  const { ids: rankedIds, scores: finalScores } = aggregateRanks(
    ids, 
    waspasScores, 
    gnnScores, 
    simScores,
    [0.5, 0.3, 0.2]
  );

  // Create decision path for auditability
  const decisionPath = {
    waspasScores: Object.fromEntries(ids.map((id, i) => [id, waspasScores[i]])),
    gnnScores: Object.fromEntries(ids.map((id, i) => [id, gnnScores[i]])),
    similarityScores: Object.fromEntries(ids.map((id, i) => [id, simScores[i]])),
    finalScores: Object.fromEntries(rankedIds.map((id, i) => [id, finalScores[i]]))
  };

  // Generate recommendations with confidence scores, wait times, and resources
  const recommendations = rankedIds.map((specialistId, index) => {
    const specialist = availableSpecialists.find(s => s.id === specialistId);
    if (!specialist) return null;

    // Calculate confidence score (0-1 scale)
    const confidenceScore = finalScores[index];

    // Estimate wait time based on workload and availability
    // Higher workload and lower availability = longer wait
    const baseWaitTime = 30; // Base wait time in minutes
    const workloadFactor = specialist.workload / 10; // Normalize workload (0-1)
    const availabilityFactor = (100 - specialist.availability) / 100; // Normalize availability (0-1)
    const estimatedWaitTime = Math.round(
      baseWaitTime * (1 + workloadFactor * 0.5 + availabilityFactor * 0.3)
    );

    // Determine required resources based on specialty and severity
    const requiredResources = determineRequiredResources(
      specialist.specialization,
      patientSeverity,
      patientUrgency
    );

    return {
      specialistId: specialist.id,
      specialistName: specialist.label,
      specialistSpecialty: specialist.specialization,
      confidenceScore,
      estimatedWaitTime,
      requiredResources,
      rank: index + 1
    };
  }).filter(Boolean) as EnhancedRoutingResult['recommendations'];

  return {
    patientId,
    recommendations,
    decisionPath
  };
}

/**
 * Determine required resources based on specialty and patient condition
 */
function determineRequiredResources(
  specialty: string,
  severity: number,
  urgency: number
): string[] {
  const resources: string[] = [];

  // Base resources for all specialties
  resources.push('Medical examination room');

  // Specialty-specific resources
  switch (specialty.toLowerCase()) {
    case 'cardiac':
      resources.push('ECG machine', 'Defibrillator');
      if (severity > 80) resources.push('Cardiac catheterization lab');
      break;
    case 'neurology':
      resources.push('CT scanner', 'MRI machine');
      if (severity > 80) resources.push('Neurosurgery suite');
      break;
    case 'trauma':
      resources.push('X-ray machine', 'Orthopedic tools');
      if (severity > 80) resources.push('Operating room');
      break;
    case 'emergency':
      resources.push('IV equipment', 'Ventilator');
      if (severity > 80) resources.push('ICU bed');
      break;
    case 'general medicine':
      resources.push('Basic lab equipment');
      break;
    default:
      resources.push('General medical equipment');
  }

  // Urgency-based resources
  if (urgency > 80) {
    resources.push('Immediate attention');
  } else if (urgency > 60) {
    resources.push('Priority attention');
  }

  return resources;
}

/**
 * Validate specialist recommendations against live availability
 */
export function validateRecommendations(
  recommendations: EnhancedRoutingResult['recommendations'],
  liveSpecialistStatus: Record<string, { available: boolean; currentLoad: number }>
): EnhancedRoutingResult['recommendations'] {
  return recommendations.filter(rec => {
    const status = liveSpecialistStatus[rec.specialistId];
    return status && status.available && status.currentLoad < 100;
  });
}

/**
 * Apply load balancing to distribute patients evenly
 */
export function applyLoadBalancing(
  recommendations: EnhancedRoutingResult['recommendations'],
  liveSpecialistStatus: Record<string, { available: boolean; currentLoad: number }>
): EnhancedRoutingResult['recommendations'] {
  return recommendations.map(rec => {
    const status = liveSpecialistStatus[rec.specialistId];
    if (status) {
      // Adjust confidence score based on current load (lower load = higher preference)
      const loadAdjustment = (100 - status.currentLoad) / 100;
      const adjustedConfidence = rec.confidenceScore * loadAdjustment;
      
      // Adjust wait time based on current load
      const loadWaitAdjustment = status.currentLoad / 50; // 0-2 factor
      const adjustedWaitTime = Math.round(rec.estimatedWaitTime * (1 + loadWaitAdjustment));
      
      return {
        ...rec,
        confidenceScore: adjustedConfidence,
        estimatedWaitTime: adjustedWaitTime
      };
    }
    return rec;
  }).sort((a, b) => b.confidenceScore - a.confidenceScore); // Re-sort by adjusted confidence
}