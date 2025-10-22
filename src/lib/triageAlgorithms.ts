// Core triage and routing algorithms

export interface PatientData {
  id: string;
  age: number;
  temperature: number;
  severity: number;
  urgency: number;
  resourceNeed: number;
  waitingImpact: number;
  ageVulnerability: number;
  painLevel: number;
  conditionDesc: string;
  registrationTime: Date;
}

export interface TriageResult extends PatientData {
  topsisScore: number;
  prometheeScore: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  fuzzyLabel: string;
}

export interface Specialist {
  id: string;
  label: string;
  expertise: number;
  availability: number;
  successRate: number;
  resourceAccess: number;
  workload: number;
  specialization: string;
}

export interface RoutingResult {
  patientId: string;
  waspasScores: Record<string, number>;
  gnnScores: Record<string, number>;
  simScores: Record<string, number>;
  fusedRanking: Array<{ id: string; label: string; score: number }>;
  recommended: { id: string; label: string; score: number } | null;
}

// Normalize columns by vector norm
function normalizeByVectorNorm(matrix: number[][]): number[][] {
  const cols = matrix[0].length;
  const rows = matrix.length;
  const normalized: number[][] = [];
  
  for (let j = 0; j < cols; j++) {
    const colSum = Math.sqrt(matrix.reduce((sum, row) => sum + row[j] ** 2, 0));
    const denom = colSum === 0 ? 1 : colSum;
    
    for (let i = 0; i < rows; i++) {
      if (!normalized[i]) normalized[i] = [];
      normalized[i][j] = matrix[i][j] / denom;
    }
  }
  
  return normalized;
}

// TOPSIS scoring algorithm
export function calculateTOPSIS(
  decisionMatrix: number[][],
  weights: number[],
  benefitFlags: boolean[] = [true, true, true, true, true]
): number[] {
  const normalized = normalizeByVectorNorm(decisionMatrix);
  const w = weights.map(w => w / weights.reduce((a, b) => a + b, 0));
  
  // Weighted normalized matrix
  const weighted = normalized.map(row => row.map((val, j) => val * w[j]));
  
  // Ideal best and worst
  const ideal = weighted[0].map((_, j) => {
    const col = weighted.map(row => row[j]);
    return benefitFlags[j] ? Math.max(...col) : Math.min(...col);
  });
  
  const antiIdeal = weighted[0].map((_, j) => {
    const col = weighted.map(row => row[j]);
    return benefitFlags[j] ? Math.min(...col) : Math.max(...col);
  });
  
  // Distance to ideal and anti-ideal
  const scores = weighted.map(row => {
    const dPlus = Math.sqrt(row.reduce((sum, val, j) => sum + (val - ideal[j]) ** 2, 0));
    const dMinus = Math.sqrt(row.reduce((sum, val, j) => sum + (val - antiIdeal[j]) ** 2, 0));
    return dMinus / (dPlus + dMinus + 1e-12);
  });
  
  return scores;
}

// PROMETHEE netflow calculation
export function calculatePROMETHEE(
  decisionMatrix: number[][],
  weights: number[]
): number[] {
  const m = decisionMatrix.length;
  const n = decisionMatrix[0].length;
  const W = weights.map(w => w / weights.reduce((a, b) => a + b, 0));
  
  const P: number[][] = Array(m).fill(0).map(() => Array(m).fill(0));
  
  const ranges = decisionMatrix[0].map((_, j) => {
    const col = decisionMatrix.map(row => row[j]);
    const range = Math.max(...col) - Math.min(...col);
    return range === 0 ? 1 : range;
  });
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      if (i === j) continue;
      
      let pref = 0;
      for (let k = 0; k < n; k++) {
        const diff = (decisionMatrix[i][k] - decisionMatrix[j][k]) / ranges[k];
        const preference = 1.0 / (1.0 + Math.exp(-5.0 * diff));
        pref += W[k] * preference;
      }
      P[i][j] = pref;
    }
  }
  
  const phiPlus = P.map(row => row.reduce((a, b) => a + b, 0) / (m - 1));
  const phiMinus = P[0].map((_, j) => P.reduce((sum, row) => sum + row[j], 0) / (m - 1));
  
  return phiPlus.map((plus, i) => plus - phiMinus[i]);
}

// Fuzzy Mamdani inference
export function fuzzyMamdaniLabel(
  severityNorm: number,
  urgencyNorm: number,
  waitingNorm: number
): string {
  const low = (x: number) => Math.max(0, Math.min((0.5 - x) / 0.5, 1));
  const med = (x: number) => Math.max(0, 1 - Math.abs(x - 0.5) / 0.25);
  const high = (x: number) => Math.max(0, Math.min((x - 0.5) / 0.5, 1));
  
  const sevH = high(severityNorm);
  const sevM = med(severityNorm);
  const sevL = low(severityNorm);
  
  const urgH = high(urgencyNorm);
  const urgM = med(urgencyNorm);
  const urgL = low(urgencyNorm);
  
  const waitH = high(waitingNorm);
  const waitM = med(waitingNorm);
  const waitL = low(waitingNorm);
  
  const rules: Array<[number, number]> = [
    [Math.max(sevH, urgH, waitH), 0.95],
    [Math.max(Math.min(sevM, urgM), Math.min(sevH, urgM), Math.min(sevM, urgH)), 0.7],
    [Math.max(Math.min(sevM, urgL), Math.min(sevL, urgM)), 0.45],
    [Math.min(sevL, urgL, waitL), 0.12]
  ];
  
  const num = rules.reduce((sum, [w, s]) => sum + w * s, 0);
  const den = rules.reduce((sum, [w]) => sum + w, 0) + 1e-12;
  const score = num / den;
  
  if (score >= 0.8) return 'Emergency/Immediate';
  if (score >= 0.6) return 'Urgent';
  if (score >= 0.35) return 'Semi-Urgent';
  return 'Routine';
}

// Calculate age vulnerability
export function calculateAgeVulnerability(age: number): number {
  if (age >= 75) return 90;
  if (age >= 65) return 70;
  if (age <= 5) return 85;
  if (age <= 18) return 60;
  return 30;
}

// PCA-based weight calculation (simplified)
export function calculatePCAWeights(decisionMatrix: number[][]): number[] {
  if (decisionMatrix.length < 3) {
    return [0.35, 0.30, 0.15, 0.15, 0.05];
  }
  
  // Simplified PCA: use variance-based weighting
  const n = decisionMatrix[0].length;
  const weights: number[] = [];
  
  for (let j = 0; j < n; j++) {
    const col = decisionMatrix.map(row => row[j]);
    const mean = col.reduce((a, b) => a + b, 0) / col.length;
    const variance = col.reduce((sum, val) => sum + (val - mean) ** 2, 0) / col.length;
    weights.push(Math.sqrt(variance));
  }
  
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / (sum || 1));
}

// WASPAS for specialist routing
export function calculateWASPAS(
  specialists: Specialist[],
  lambda: number = 0.5
): { ids: string[]; scores: number[] } {
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
export function adjustScoresWithGNN(
  baseScores: number[],
  availabilityVector: number[],
  adjacencyMatrix: number[][],
  eta: number = 0.2,
  iterations: number = 2
): number[] {
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
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dot = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val ** 2, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (mag1 * mag2 + 1e-12);
}

// Rank-based aggregation
export function rankLikeScores(scores: number[]): { scorelike: number[]; ranks: number[] } {
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

// Aggregate multiple ranking methods
export function aggregateRanks(
  ids: string[],
  waspasScores: number[],
  gnnScores: number[],
  simScores: number[],
  weights: [number, number, number] = [0.5, 0.3, 0.2]
): { ids: string[]; scores: number[] } {
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
