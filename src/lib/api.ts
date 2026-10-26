const API_BASE = "http://localhost:8000";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error ${response.status}: ${errText || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export interface PatientInput {
  name: string;
  age: number;
  gender: string;
  condition?: string;
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

export interface Finding {
  label: string;
  confidence: number;
}

export interface ReportDetail {
  findings: string;
  impression: string;
  recommendations: string;
}

export interface AnalysisRecord {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  age?: number;
  gender?: string;
  type: "chest" | "bone";
  bodyPart?: string;
  primary: string;
  confidence: number;
  status: "reviewed" | "pending" | "flagged" | "archived";
  findings: Finding[];
  report: ReportDetail;
  fractureType?: string;
  localization?: string;
  notes?: string;
  imageUrl?: string;
}

export interface WeeklyVolumeItem {
  day: string;
  chest: number;
  bone: number;
}

export interface DashboardStats {
  totalAnalyses: string;
  recentAnalyses: string;
  pendingReviews: string;
  modelAccuracy: string;
  totalDelta: string;
  recentDelta: string;
  pendingDelta: string;
  accuracyDelta: string;
  weeklyVolume: WeeklyVolumeItem[];
  recentRecords: AnalysisRecord[];
}

export const api = {
  patients: {
    list: async (query?: string): Promise<Patient[]> => {
      const path = query ? `/patients?query=${encodeURIComponent(query)}` : "/patients";
      return apiFetch<Patient[]>(path);
    },
    get: async (id: string): Promise<Patient> => {
      return apiFetch<Patient>(`/patients/${id}`);
    },
    create: async (data: PatientInput): Promise<Patient> => {
      return apiFetch<Patient>("/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<PatientInput>): Promise<Patient> => {
      return apiFetch<Patient>(`/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  },
  analyses: {
    detectBodyPart: async (imageFile: File): Promise<{ bodyPart: string; analysisType?: string; confidence: number; method: string }> => {
      const formData = new FormData();
      formData.append("image", imageFile);

      const url = `${API_BASE}/analysis/detect-body-part`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Detection failed ${response.status}: ${errText}`);
      }

      return response.json() as Promise<{ bodyPart: string; analysisType?: string; confidence: number; method: string }>;
    },
    list: async (filters?: { type?: string; patientId?: string; status?: string }): Promise<AnalysisRecord[]> => {
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.patientId) params.append("patient_id", filters.patientId);
      if (filters?.status) params.append("status", filters.status);
      
      const path = `/analysis/history?${params.toString()}`;
      return apiFetch<AnalysisRecord[]>(path);
    },
    get: async (id: string): Promise<AnalysisRecord> => {
      return apiFetch<AnalysisRecord>(`/analysis/${id}`);
    },
    upload: async (
      type: "chest" | "bone",
      imageFile: File,
      meta: {
        bodyPart?: string;
        patientId?: string;
        patientName?: string;
        age?: number;
        gender?: string;
        notes?: string;
      }
    ): Promise<AnalysisRecord> => {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      if (type === "bone" && meta.bodyPart) {
        formData.append("body_part", meta.bodyPart);
      }
      if (meta.patientId) formData.append("patient_id", meta.patientId);
      if (meta.patientName) formData.append("patient_name", meta.patientName);
      if (meta.age !== undefined) formData.append("age", String(meta.age));
      if (meta.gender) formData.append("gender", meta.gender);
      if (meta.notes) formData.append("notes", meta.notes);

      const url = `${API_BASE}/analysis/${type}`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed ${response.status}: ${errText}`);
      }

      return response.json() as Promise<AnalysisRecord>;
    },
    updateStatus: async (id: string, status: string): Promise<AnalysisRecord> => {
      return apiFetch<AnalysisRecord>(`/analysis/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
  },
  dashboard: {
    stats: async (): Promise<DashboardStats> => {
      return apiFetch<DashboardStats>("/dashboard/stats");
    },
  },
  reports: {
    pdfUrl: (id: string): string => {
      return `${API_BASE}/reports/${id}/pdf`;
    },
  },
  training: {
    start: async (type: "chest" | "bone", epochs: number, lr: number): Promise<{ message: string }> => {
      return apiFetch<{ message: string }>("/analysis/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, epochs, lr }),
      });
    },
    status: async (): Promise<TrainingStatus> => {
      return apiFetch<TrainingStatus>("/analysis/train/status");
    },
  },
};

export interface TrainingMetric {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface TrainingStatus {
  status: "idle" | "running" | "completed" | "failed";
  type?: "chest" | "bone";
  currentEpoch?: number;
  totalEpochs?: number;
  progress?: number;
  loss?: number;
  accuracy?: number;
  error?: string;
  metricsHistory?: TrainingMetric[];
}
