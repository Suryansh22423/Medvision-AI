export type AnalysisType = "chest" | "bone";
export type AnalysisStatus = "reviewed" | "pending" | "flagged" | "archived";
export type Severity = "mild" | "moderate" | "severe";

export function severityFor(confidence: number, primary: string): Severity {
  const benign = /no finding|no fracture/i.test(primary);
  if (benign) return "mild";
  if (confidence >= 85) return "severe";
  if (confidence >= 60) return "moderate";
  return "mild";
}


export interface Finding {
  label: string;
  confidence: number;
}

export interface AnalysisRecord {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  age?: number | undefined;
  gender?: string | undefined;
  type: AnalysisType;
  bodyPart?: string | undefined;
  primary: string;
  confidence: number;
  status: AnalysisStatus;
  findings: Finding[];
  fractureType?: string | undefined;
  localization?: string | undefined;
  notes?: string | undefined;
  imageUrl?: string | undefined;
  report: {
    findings: string;
    impression: string;
    recommendations: string;
  };
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  analyses: number;
  condition: string;
}

export const CHEST_CONDITIONS = [
  "Pneumonia",
  "Tuberculosis",
  "Pneumothorax",
  "Cardiomegaly",
  "Pleural Effusion",
  "Atelectasis",
  "Pulmonary Edema",
  "Nodule / Mass",
  "Consolidation",
  "No Finding",
];

export const BONE_PARTS = [
  "Hand",
  "Wrist",
  "Finger",
  "Elbow",
  "Shoulder",
  "Forearm",
  "Femur",
  "Tibia",
  "Knee",
  "Ankle",
  "Foot",
];

export const FRACTURE_TYPES = [
  "Transverse fracture",
  "Oblique fracture",
  "Spiral fracture",
  "Comminuted fracture",
  "Greenstick fracture",
  "Avulsion fracture",
  "No fracture detected",
];

export const HOW_IT_WORKS = [
  {
    title: "Upload the study",
    text: "Drag and drop a chest or bone X-ray in PNG, JPG or DICOM-style format.",
  },
  {
    title: "Select analysis type",
    text: "Choose chest pathology screening or fracture detection with body part.",
  },
  {
    title: "AI inference",
    text: "Ensemble CNN models run multi-label classification and localization.",
  },
  {
    title: "Review findings",
    text: "Inspect confidence scores, heatmaps and bounding boxes side by side.",
  },
  {
    title: "Sign off report",
    text: "Edit the preliminary report, export PDF and save to patient history.",
  },
];

export const MOCK_ANALYSES: AnalysisRecord[] = [
  {
    id: "AN-20482",
    date: "2026-07-31T09:14:00Z",
    patientId: "PT-1043",
    patientName: "Amara Okafor",
    age: 54,
    gender: "Female",
    type: "chest",
    primary: "Pneumonia",
    confidence: 92,
    status: "pending",
    findings: [
      { label: "Pneumonia", confidence: 92 },
      { label: "Consolidation", confidence: 71 },
      { label: "Pleural Effusion", confidence: 34 },
      { label: "Cardiomegaly", confidence: 12 },
      { label: "Pneumothorax", confidence: 4 },
    ],
    report: {
      findings:
        "Patchy airspace opacification within the right lower lobe with air bronchograms. No pneumothorax. Cardiomediastinal silhouette within normal limits. Costophrenic angles preserved bilaterally.",
      impression:
        "Findings most consistent with right lower lobe community-acquired pneumonia (92% model confidence).",
      recommendations:
        "Correlate with clinical picture, inflammatory markers and sputum culture. Consider follow-up radiograph in 4–6 weeks to confirm resolution.",
    },
  },
  {
    id: "AN-20481",
    date: "2026-07-30T16:02:00Z",
    patientId: "PT-0871",
    patientName: "Liam Castellanos",
    age: 31,
    gender: "Male",
    type: "bone",
    bodyPart: "Wrist",
    primary: "Transverse fracture",
    confidence: 88,
    status: "reviewed",
    fractureType: "Transverse fracture",
    localization: "Distal radius, ~2 cm proximal to the articular surface, minimal dorsal angulation.",
    findings: [
      { label: "Transverse fracture", confidence: 88 },
      { label: "Cortical disruption", confidence: 64 },
      { label: "Soft tissue swelling", confidence: 41 },
      { label: "Dislocation", confidence: 9 },
    ],
    report: {
      findings:
        "Transverse fracture line through the distal radial metaphysis with intact ulnar styloid. Mild dorsal angulation. No intra-articular extension identified.",
      impression: "Acute extra-articular distal radius fracture (88% model confidence).",
      recommendations:
        "Orthopaedic review for closed reduction and immobilisation. Repeat imaging post-reduction.",
    },
  },
  {
    id: "AN-20478",
    date: "2026-07-30T11:47:00Z",
    patientId: "PT-0662",
    patientName: "Sofia Lindqvist",
    age: 67,
    gender: "Female",
    type: "chest",
    primary: "Cardiomegaly",
    confidence: 79,
    status: "reviewed",
    findings: [
      { label: "Cardiomegaly", confidence: 79 },
      { label: "Pulmonary Edema", confidence: 52 },
      { label: "Pleural Effusion", confidence: 44 },
      { label: "Pneumonia", confidence: 8 },
    ],
    report: {
      findings:
        "Cardiothoracic ratio exceeds 0.55 on this PA projection. Mild perihilar haziness with upper zone vascular redistribution. Small bilateral pleural effusions.",
      impression: "Cardiomegaly with features suggestive of mild pulmonary venous congestion.",
      recommendations: "Echocardiography and BNP correlation recommended.",
    },
  },
  {
    id: "AN-20465",
    date: "2026-07-29T08:20:00Z",
    patientId: "PT-1120",
    patientName: "Noah Brennan",
    age: 22,
    gender: "Male",
    type: "bone",
    bodyPart: "Ankle",
    primary: "Oblique fracture",
    confidence: 84,
    status: "flagged",
    fractureType: "Oblique fracture",
    localization: "Lateral malleolus, oblique course extending distally, no talar shift.",
    findings: [
      { label: "Oblique fracture", confidence: 84 },
      { label: "Soft tissue swelling", confidence: 58 },
      { label: "Joint effusion", confidence: 27 },
    ],
    report: {
      findings:
        "Oblique fracture of the lateral malleolus without significant displacement. Ankle mortise preserved.",
      impression: "Weber A type lateral malleolar fracture (84% model confidence).",
      recommendations: "Immobilisation and weight-bearing assessment; clinical follow-up in 10 days.",
    },
  },
  {
    id: "AN-20450",
    date: "2026-07-28T13:05:00Z",
    patientId: "PT-0345",
    patientName: "Priya Raghavan",
    age: 45,
    gender: "Female",
    type: "chest",
    primary: "Tuberculosis",
    confidence: 76,
    status: "pending",
    findings: [
      { label: "Tuberculosis", confidence: 76 },
      { label: "Nodule / Mass", confidence: 48 },
      { label: "Atelectasis", confidence: 22 },
    ],
    report: {
      findings:
        "Upper zone reticulonodular opacities with volume loss and possible cavitation on the right apex.",
      impression: "Pattern suspicious for active pulmonary tuberculosis.",
      recommendations: "Sputum AFB / GeneXpert testing and infection control precautions.",
    },
  },
  {
    id: "AN-20441",
    date: "2026-07-27T10:33:00Z",
    patientId: "PT-0982",
    patientName: "Daniel Mwangi",
    age: 38,
    gender: "Male",
    type: "chest",
    primary: "No Finding",
    confidence: 95,
    status: "reviewed",
    findings: [
      { label: "No Finding", confidence: 95 },
      { label: "Atelectasis", confidence: 5 },
      { label: "Pneumonia", confidence: 3 },
    ],
    report: {
      findings: "Clear lung fields. Normal cardiomediastinal contours. No pleural abnormality.",
      impression: "No acute cardiopulmonary abnormality detected.",
      recommendations: "No radiological follow-up required.",
    },
  },
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "PT-1043",
    name: "Amara Okafor",
    age: 54,
    gender: "Female",
    lastVisit: "2026-07-31",
    analyses: 4,
    condition: "Pneumonia (active)",
  },
  {
    id: "PT-0871",
    name: "Liam Castellanos",
    age: 31,
    gender: "Male",
    lastVisit: "2026-07-30",
    analyses: 2,
    condition: "Distal radius fracture",
  },
  {
    id: "PT-0662",
    name: "Sofia Lindqvist",
    age: 67,
    gender: "Female",
    lastVisit: "2026-07-30",
    analyses: 7,
    condition: "Cardiomegaly",
  },
  {
    id: "PT-1120",
    name: "Noah Brennan",
    age: 22,
    gender: "Male",
    lastVisit: "2026-07-29",
    analyses: 1,
    condition: "Ankle fracture",
  },
  {
    id: "PT-0345",
    name: "Priya Raghavan",
    age: 45,
    gender: "Female",
    lastVisit: "2026-07-28",
    analyses: 3,
    condition: "Suspected TB",
  },
  {
    id: "PT-0982",
    name: "Daniel Mwangi",
    age: 38,
    gender: "Male",
    lastVisit: "2026-07-27",
    analyses: 2,
    condition: "Routine screening",
  },
];

export const WEEKLY_VOLUME = [
  { day: "Mon", chest: 18, bone: 9 },
  { day: "Tue", chest: 24, bone: 12 },
  { day: "Wed", chest: 21, bone: 15 },
  { day: "Thu", chest: 30, bone: 11 },
  { day: "Fri", chest: 27, bone: 18 },
  { day: "Sat", chest: 12, bone: 6 },
  { day: "Sun", chest: 8, bone: 4 },
];
