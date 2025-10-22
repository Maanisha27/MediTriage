import { Specialist } from './triageAlgorithms';

export const SPECIALISTS: Specialist[] = [
  {
    id: 'CARD_01',
    label: 'Specialist_1',
    expertise: 92,
    availability: 80,
    successRate: 88,
    resourceAccess: 90,
    workload: 6,
    specialization: 'Cardiac'
  },
  {
    id: 'NEUR_02',
    label: 'Specialist_2',
    expertise: 89,
    availability: 70,
    successRate: 90,
    resourceAccess: 75,
    workload: 4,
    specialization: 'Neurology'
  },
  {
    id: 'TRMA_03',
    label: 'Specialist_3',
    expertise: 95,
    availability: 65,
    successRate: 91,
    resourceAccess: 85,
    workload: 9,
    specialization: 'Trauma'
  },
  {
    id: 'GENM_04',
    label: 'Specialist_4',
    expertise: 80,
    availability: 90,
    successRate: 82,
    resourceAccess: 70,
    workload: 3,
    specialization: 'General Medicine'
  },
  {
    id: 'EMER_05',
    label: 'Specialist_5',
    expertise: 88,
    availability: 85,
    successRate: 87,
    resourceAccess: 80,
    workload: 5,
    specialization: 'Emergency'
  }
];

export const SPECIALIST_SYMPTOM_VECTORS: Record<string, number[]> = {
  'CARD_01': [1, 0, 0, 0, 0.95, 0.2, 0.2, 0.1],
  'NEUR_02': [0, 1, 0, 0, 0.2, 0.95, 0.2, 0.1],
  'TRMA_03': [0, 0, 1, 0, 0.3, 0.3, 0.9, 0.1],
  'GENM_04': [0.5, 0.5, 0.2, 0.2, 0.5, 0.5, 0.5, 0.4],
  'EMER_05': [0.7, 0.6, 0.5, 0.6, 0.9, 0.8, 0.6, 0.3]
};

export const ADJACENCY_MATRIX = [
  [1.0, 0.2, 0.6, 0.1, 0.3],
  [0.2, 1.0, 0.2, 0.1, 0.4],
  [0.6, 0.2, 1.0, 0.1, 0.3],
  [0.1, 0.1, 0.1, 1.0, 0.2],
  [0.3, 0.4, 0.3, 0.2, 1.0]
];

export const SAMPLE_PATIENTS = [
  ['P001', 60, 39.0, 90, 85, 80, 90, 7, 'Acute Myocardial Infarction'],
  ['P002', 8, 37.5, 80, 85, 70, 80, 6, 'Severe Asthma Exacerbation'],
  ['P003', 72, 38.2, 85, 90, 85, 88, 6, 'Displaced Hip Fracture'],
  ['P004', 25, 36.8, 30, 25, 20, 20, 2, 'Deep Laceration'],
  ['P005', 55, 39.5, 90, 95, 90, 90, 3, 'Acute Ischemic Stroke'],
  ['P006', 60, 38.8, 85, 80, 75, 85, 7, 'Severe Pneumonia'],
  ['P007', 35, 37.2, 70, 75, 60, 65, 8, 'Appendicitis'],
  ['P008', 50, 36.9, 60, 55, 50, 60, 5, 'Fractured Arm'],
  ['P009', 28, 39.2, 40, 50, 20, 30, 7, 'Migraine Attack'],
  ['P010', 65, 37.8, 85, 80, 90, 85, 5, 'Chronic Heart Failure']
];

export function buildPatientSymptomVector(conditionDesc: string, severity: number, urgency: number, painLevel: number, age: number): number[] {
  const cond = conditionDesc.toLowerCase();
  
  const cardiac = ['heart', 'card', 'mi', 'angina', 'myocardial'].some(k => cond.includes(k)) ? 1.0 : 0.0;
  const neuro = ['stroke', 'neuro', 'seizure', 'paralysis'].some(k => cond.includes(k)) ? 1.0 : 0.0;
  const trauma = ['trauma', 'fracture', 'injury', 'bleed', 'laceration'].some(k => cond.includes(k)) ? 1.0 : 0.0;
  const metabolic = ['diabet', 'metabolic', 'keto', 'hypogly'].some(k => cond.includes(k)) ? 1.0 : 0.0;
  
  return [
    cardiac,
    neuro,
    trauma,
    metabolic,
    severity / 100,
    urgency / 100,
    painLevel / 10,
    age / 100
  ];
}
