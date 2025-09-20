import { Project } from "@/types/project";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface BackendProject {
  project_name: string;
  company_name: string;
  telefon_nummer: string;
  email: string;
  contact_person: string;
  application: string;
  sub_application: string;
  solids_percentage: number;
  customer_throughput_per_day: number;
  workdays_per_week: number;
  protection_class: string;
  motor_efficiency?: string | null;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
  // New calculation details
  years?: number;
  energy_price_eur_per_kwh?: number;
  water_price_eur_per_l?: number;
}

export interface ProjectsListResponse {
  success: boolean;
  count: number;
  projects: BackendProject[];
}

export interface ProjectResponse {
  success: boolean;
  project: BackendProject;
  message: string;
}

export interface TCOCalculationRequest {
  years?: number;
  electricity_eur_per_kwh?: number;
  water_eur_per_l?: number;
  commissioning_pct?: number;
  extra_maint_pct?: number;
  label?: string;
  operation_hours_per_year?: number;
  throughput_per_day?: number;
  workdays_per_week?: number;
  operation_hours_per_day?: number;
}

export interface ProjectTCOResponse {
  success: boolean;
  project: BackendProject;
  relevant_machines: any[];
  tco_results: Array<{
    label: string;
    monthly_cum_total: number[];
    ca: number;
    cc: number;
    co: number;
    cm: number;
  }>;
  message: string;
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }
  return resp.json() as Promise<T>;
}

export function apiHealth() {
  return http<{ status: string; service: string }>(`/health`);
}

export function apiListProjects() {
  return http<ProjectsListResponse>(`/api/calculation/projects`);
}

export function apiGetProject(projectName: string) {
  return http<ProjectResponse>(`/api/calculation/projects/${encodeURIComponent(projectName)}`);
}

export function apiUpsertProject(data: BackendProject) {
  return http<ProjectResponse>(`/api/calculation/projects`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function apiCalculateProjectTCO(projectName: string, payload: TCOCalculationRequest) {
  return http<ProjectTCOResponse>(`/api/calculation/projects/${encodeURIComponent(projectName)}/tco`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function mapFrontendProjectToBackend(p: Project): BackendProject {
  return {
    project_name: p.projectName,
    company_name: p.company,
    telefon_nummer: p.telephone,
    email: p.mail,
    contact_person: p.contact,
    application: p.application,
    sub_application: p.subApplication,
    solids_percentage: Number(p.feedSolid) || 0,
    customer_throughput_per_day: p.capacityPerDay,
    workdays_per_week: p.workdaysPerWeek || 5,
    protection_class: p.protectionClass,
    motor_efficiency: p.motorEfficiency,
    length_mm: p.maxLength,
    width_mm: p.maxWidth,
    height_mm: p.maxHeight,
    weight_kg: p.maxWeight,
    years: p.years,
    energy_price_eur_per_kwh: p.energyPriceEurPerKwh,
    water_price_eur_per_l: p.waterPriceEurPerL,
  };
}

export function mapBackendProjectToFrontend(bp: BackendProject): Project {
  return {
    id: bp.project_name,
    projectName: bp.project_name,
    company: bp.company_name,
    contact: bp.contact_person,
    telephone: bp.telefon_nummer,
    mail: bp.email,
    application: bp.application,
    subApplication: bp.sub_application,
    feedSolid: String(bp.solids_percentage ?? ""),
    capacityPerDay: bp.customer_throughput_per_day,
    years: bp.years ?? 5,
    workdaysPerWeek: bp.workdays_per_week ?? 5,
    energyPriceEurPerKwh: bp.energy_price_eur_per_kwh ?? 0.25,
    waterPriceEurPerL: bp.water_price_eur_per_l ?? 0.002,
    protectionClass: bp.protection_class,
    motorEfficiency: bp.motor_efficiency || "",
    maxWidth: bp.width_mm,
    maxLength: bp.length_mm,
    maxHeight: bp.height_mm,
    maxWeight: bp.weight_kg,
    tcoTotal: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    machines: [],
  };
}


