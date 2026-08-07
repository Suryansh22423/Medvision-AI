import { api, type AnalysisRecord } from "./api";

export async function listAnalyses(): Promise<AnalysisRecord[]> {
  return api.analyses.list();
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | undefined> {
  try {
    return await api.analyses.get(id);
  } catch {
    return undefined;
  }
}

export async function updateStatus(id: string, status: AnalysisRecord["status"]): Promise<void> {
  await api.analyses.updateStatus(id, status);
}

export async function updateStatuses(ids: string[], status: AnalysisRecord["status"]): Promise<void> {
  await Promise.all(ids.map((id) => api.analyses.updateStatus(id, status)));
}
