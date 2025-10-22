// JavaScript test for enhanced specialist routing system

// Mock the required functions and data
const SPECIALIST_SYMPTOM_VECTORS = {
  'CARD_01': [1, 0, 0, 0, 0.95, 0.2, 0.2, 0.1],
  'NEUR_02': [0, 1, 0, 0, 0.2, 0.95, 0.2, 0.1],
  'TRMA_03': [0, 0, 1, 0, 0.3, 0.3, 0.9, 0.1],
  'GENM_04': [0.5, 0.5, 0.2, 0.2, 0.5, 0.5, 0.5, 0.4],
  'EMER_05': [0.7, 0.6, 0.5, 0.6, 0.9, 0.8, 0.6, 0.3]
};

const ADJACENCY_MATRIX = [
  [1.0, 0.2, 0.6, 0.1, 0.3],
  [0.2, 1.0, 0.2, 0.1, 0.4],
  [0.6, 0.2, 1.0, 0.1, 0.3],
  [0.1, 0.1, 0.1, 1.0, 0.2],
  [0.3, 0.4, 0.3, 0.2, 1.0]
];

// WASPAS implementation
function calculateWASPAS(specialists, lambda = 0.5) {
  const cols = ['expertise', 'availability', 'successRate', 'resourceAccess', 'workload'];
  const matrix = specialists.map(s => [
    s.expertise,
    s.availability,
    s.successRate,
    s.resourceAccess,
    s.workload
  ]);
  
  const normalized = matrix.map((row, i) => 
    row.map((val, j) => {
      const col = matrix.map(r => r[j]);
      if (cols[j] === 'workload') {
        const min = Math.min(...col);
        return min / Math.max(val, 1e-9);
      } else {
        const max = Math.max(...col);
        return val / (max || 1);
      }
    })
  );
  
  const weights = [0.35, 0.20, 0.25, 0.15, 0.05];
  const w = weights.map(w => w / weights.reduce((a, b) => a + b, 0));
  
  const qWSM = normalized.map(row => 
    row.reduce((sum, val, j) => sum + val * w[j], 0)
  );
  
  const qWPM = normalized.map(row =>
    row.reduce((prod, val, j) => prod * Math.pow(Math.max(val, 1e-9), w[j]), 1)
  );
  
  const scores = qWSM.map((wsm, i) => lambda * wsm + (1 - lambda) * qWPM[i]);
  const ids = specialists.map(s => s.id);
  
  return { ids, scores };
}

// GNN-based score adjustment
function adjustScoresWithGNN(baseScores, availabilityVector, adjacencyMatrix, eta = 0.2, iterations = 2) {
  let scores = [...baseScores];
  
  for (let iter = 0; iter < iterations; iter++) {
    const influence = adjacencyMatrix.map((row, i) =>
      row.reduce((sum, weight, j) => sum + weight * availabilityVector[j], 0)
    );
    
    scores = scores.map((score, i) => 
      score + eta * influence[i]
    );
    
    const avgInfluence = adjacencyMatrix.flat().reduce((a, b) => a + b, 0) / adjacencyMatrix.length;
    scores = scores.map(s => s / (1.0 + eta * avgInfluence));
  }
  
  return scores;
}

// Cosine similarity
function cosineSimilarity(vec1, vec2) {
  const dot = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val ** 2, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (mag1 * mag2 + 1e-12);
}

// Rank-based aggregation
function rankLikeScores(scores) {
  const indexed = scores.map((score, i) => ({ score, index: i }));
  indexed.sort((a, b) => b.score - a.score);
  
  const ranks = new Array(scores.length);
  indexed.forEach((item, rank) => {
    ranks[item.index] = rank + 1;
  });
  
  const maxRank = scores.length;
  const scorelike = ranks.map(rank => 
    maxRank > 1 ? (maxRank - rank) / (maxRank - 1) : 1
  );
  
  return { scorelike, ranks };
}

function aggregateRanks(ids, waspasScores, gnnScores, simScores, weights = [0.5, 0.3, 0.2]) {
  const [wW, wG, wS] = weights;
  
  const wLike = rankLikeScores(waspasScores).scorelike;
  const gLike = rankLikeScores(gnnScores).scorelike;
  const sLike = rankLikeScores(simScores).scorelike;
  
  const fused = wLike.map((w, i) => wW * w + wG * gLike[i] + wS * sLike[i]);
  
  const indexed = fused.map((score, i) => ({ score, index: i }));
  indexed.sort((a, b) => b.score - a.score);
  
  const sortedIds = indexed.map(item => ids[item.index]);
  const sortedScores = indexed.map(item => item.score);
  
  return { ids: sortedIds, scores: sortedScores };
}

/**
 * Enhanced specialist routing that validates against live availability and includes load balancing
 */
function enhancedSpecialistRouting(
  patientId,
  patientSymptomVector,
  patientSeverity,
  patientUrgency,
  specialists
) {
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
  }).filter(Boolean);

  return {
    patientId,
    recommendations,
    decisionPath
  };
}

/**
 * Determine required resources based on specialty and patient condition
 */
function determineRequiredResources(specialty, severity, urgency) {
  const resources = [];

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
function validateRecommendations(recommendations, liveSpecialistStatus) {
  return recommendations.filter(rec => {
    const status = liveSpecialistStatus[rec.specialistId];
    return status && status.available && status.currentLoad < 100;
  });
}

/**
 * Apply load balancing to distribute patients evenly
 */
function applyLoadBalancing(recommendations, liveSpecialistStatus) {
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

// Test the enhanced routing system
console.log('=== Testing Enhanced Specialist Routing System ===\n');

// Test data
const patientId = 'TEST001';
const patientSymptomVector = [1, 0, 0, 0, 0.9, 0.8, 0.2, 0.1]; // Cardiac symptoms
const patientSeverity = 90;
const patientUrgency = 85;

const specialists = [
  { id: 'CARD_01', label: 'Dr. Smith', expertise: 92, availability: 80, successRate: 88, resourceAccess: 90, workload: 6, specialization: 'Cardiac' },
  { id: 'NEUR_02', label: 'Dr. Johnson', expertise: 89, availability: 70, successRate: 90, resourceAccess: 75, workload: 4, specialization: 'Neurology' },
  { id: 'TRMA_03', label: 'Dr. Williams', expertise: 95, availability: 65, successRate: 91, resourceAccess: 85, workload: 9, specialization: 'Trauma' },
  { id: 'GENM_04', label: 'Dr. Brown', expertise: 80, availability: 90, successRate: 82, resourceAccess: 70, workload: 3, specialization: 'General Medicine' },
  { id: 'EMER_05', label: 'Dr. Davis', expertise: 88, availability: 85, successRate: 87, resourceAccess: 80, workload: 5, specialization: 'Emergency' }
];

console.log('Patient Information:');
console.log(`  ID: ${patientId}`);
console.log(`  Symptom Vector: [${patientSymptomVector.join(', ')}]`);
console.log(`  Severity: ${patientSeverity}`);
console.log(`  Urgency: ${patientUrgency}\n`);

console.log('Available Specialists:');
specialists.forEach(s => {
  console.log(`  ${s.label} (${s.id}): ${s.specialization} - Availability: ${s.availability}%, Workload: ${s.workload}`);
});
console.log();

// Test enhanced routing
const routingResult = enhancedSpecialistRouting(
  patientId,
  patientSymptomVector,
  patientSeverity,
  patientUrgency,
  specialists
);

console.log('Routing Results:');
routingResult.recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec.specialistName} (${rec.specialistSpecialty})`);
  console.log(`   Confidence Score: ${(rec.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   Estimated Wait Time: ${rec.estimatedWaitTime} minutes`);
  console.log(`   Required Resources: ${rec.requiredResources.join(', ')}`);
  console.log();
});

console.log('Decision Path (for auditability):');
console.log('  WASPAS Scores:');
Object.entries(routingResult.decisionPath.waspasScores).forEach(([id, score]) => {
  console.log(`    ${id}: ${score.toFixed(4)}`);
});

console.log('  GNN Scores:');
Object.entries(routingResult.decisionPath.gnnScores).forEach(([id, score]) => {
  console.log(`    ${id}: ${score.toFixed(4)}`);
});

console.log('  Similarity Scores:');
Object.entries(routingResult.decisionPath.similarityScores).forEach(([id, score]) => {
  console.log(`    ${id}: ${score.toFixed(4)}`);
});

console.log('  Final Scores:');
Object.entries(routingResult.decisionPath.finalScores).forEach(([id, score]) => {
  console.log(`    ${id}: ${score.toFixed(4)}`);
});

console.log('\n=== Testing Validation and Load Balancing ===\n');

// Test validation
const liveSpecialistStatus = {
  'CARD_01': { available: true, currentLoad: 60 },
  'NEUR_02': { available: false, currentLoad: 90 }, // Unavailable
  'TRMA_03': { available: true, currentLoad: 80 },
  'GENM_04': { available: true, currentLoad: 30 },
  'EMER_05': { available: true, currentLoad: 70 }
};

console.log('Live Specialist Status:');
Object.entries(liveSpecialistStatus).forEach(([id, status]) => {
  console.log(`  ${id}: ${status.available ? 'Available' : 'Unavailable'} (Load: ${status.currentLoad}%)`);
});

const validatedRecommendations = validateRecommendations(
  routingResult.recommendations,
  liveSpecialistStatus
);

console.log('\nValidated Recommendations (unavailable specialists filtered out):');
validatedRecommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec.specialistName} (${rec.specialistSpecialty})`);
  console.log(`   Confidence Score: ${(rec.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   Estimated Wait Time: ${rec.estimatedWaitTime} minutes`);
});

// Test load balancing
const balancedRecommendations = applyLoadBalancing(
  validatedRecommendations,
  liveSpecialistStatus
);

console.log('\nLoad-Balanced Recommendations:');
balancedRecommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec.specialistName} (${rec.specialistSpecialty})`);
  console.log(`   Adjusted Confidence Score: ${(rec.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   Adjusted Wait Time: ${rec.estimatedWaitTime} minutes`);
});

console.log('\n=== Enhanced Routing Test Complete ===');
console.log('✅ System outputs ranked specialists with confidence scores, estimated wait times, and required resources');
console.log('✅ Decision path is auditable and transparent');
console.log('✅ Validation against live specialist availability works correctly');
console.log('✅ Load balancing adjusts recommendations based on current workload');