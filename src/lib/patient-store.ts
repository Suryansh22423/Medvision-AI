import { api, type Patient, type PatientInput } from "./api";

export async function listPatients(query?: string): Promise<Patient[]> {
  return api.patients.list(query);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  try {
    return await api.patients.get(id);
  } catch {
    return undefined;
  }
}

export async function addPatient(input: PatientInput): Promise<Patient> {
  return api.patients.create(input);
}
