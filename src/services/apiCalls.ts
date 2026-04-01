import { apiClient } from './apiClient';

export interface ComponentHealthApiResponse {
  status: string;
  error?: string | null;
}

export interface HealthApiResponse {
  status: string;
  uptimeSeconds?: number;
  robot: ComponentHealthApiResponse;
  camera: ComponentHealthApiResponse;
  dms: ComponentHealthApiResponse;
}

export interface ProfileApiResponse {
  name: string;
  description?: string | null;
  workZ?: number;
  workR?: number;
  options?: Record<string, unknown> | null;
}

export interface PixelPointApiResponse {
  x: number;
  y: number;
}

export interface WaypointApiResponse {
  x: number;
  y: number;
  z?: number;
  r?: number;
}

export interface MeasurementApiResponse {
  waypointIndex: number;
  waypoint: WaypointApiResponse;
  pixelX?: number | null;
  pixelY?: number | null;
  scanResult?: Record<string, unknown> | null;
  simulated?: boolean;
  timestamp?: string | null;
}

export interface JobStatusApiResponse {
  state?: string;
  lastPointProcessed?: number;
  error?: string | null;
}

export interface JobApiResponse {
  id: string;
  options?: Record<string, unknown> | null;
  path?: WaypointApiResponse[];
  dryRun?: boolean;
  measurements?: MeasurementApiResponse[];
  status?: JobStatusApiResponse;
}

export interface PathDetectRequestApi {
  options?: Record<string, unknown> | null;
}

export interface PathItemApiResponse {
  corners?: { x: number; y: number }[];
  width_mm?: number;
  height_mm?: number;
  center_x?: number;
  center_y?: number;
  confidence?: number;
}

export interface CalibrationApiResponse {
  calibrated?: boolean;
  robotStart?: WaypointApiResponse | null;
  canvasStart?: PixelPointApiResponse | null;
  pixelsPerMm?: number | null;
}

export interface PathDetectResponseApi {
  ok: boolean;
  detections?: PathItemApiResponse[];
  image_base64?: string | null;
  pixelsPerMm?: number | null;
  markerCount?: number;
  calibration?: CalibrationApiResponse | null;
  error?: string | null;
  options?: Record<string, unknown> | null;
}

export interface PathCheckResponseApi {
  waypoints?: PixelPointApiResponse[];
}

export interface PathPopulateRequestApi {
  corners: PixelPointApiResponse[];
  measurementDensity: number;
  detections?: PathItemApiResponse[];
  options?: Record<string, unknown> | null;
}

export interface PathPopulatePointApiResponse extends PixelPointApiResponse {
  isCorner?: boolean;
  type?: 'corner' | 'measurement';
}

export interface PathPopulateResponseApi {
  waypoints?: PathPopulatePointApiResponse[];
  path?: PathPopulatePointApiResponse[];
  points?: PathPopulatePointApiResponse[];
}

export interface CreateJobRequestApi {
  path: PixelPointApiResponse[];
  workZ: number;
  workR: number;
  dryRun: boolean;
  options?: Record<string, unknown> | null;
  imageBase64?: string | null;
}

export interface JobEventApiResponse {
  type: string;
  jobId: string;
  state: string;
  lastPointProcessed?: number;
  totalPoints?: number;
  measurement?: MeasurementApiResponse | null;
  error?: string | null;
  timestamp?: string | null;
}

let healthInFlight: Promise<HealthApiResponse> | null = null;
let profileListInFlight: Promise<ProfileApiResponse[]> | null = null;
let defaultProfileInFlight: Promise<ProfileApiResponse> | null = null;
let latestJobInFlight: Promise<JobApiResponse> | null = null;
let jobsInFlight: Promise<JobApiResponse[]> | null = null;
const jobByIdInFlight = new Map<string, Promise<JobApiResponse>>();

export async function fetchHealthStatus(): Promise<HealthApiResponse> {
  if (healthInFlight) return healthInFlight;
  healthInFlight = apiClient.get<HealthApiResponse>('/api/health');
  try {
    return await healthInFlight;
  } finally {
    healthInFlight = null;
  }
}

export async function fetchProfiles(): Promise<ProfileApiResponse[]> {
  if (profileListInFlight) return profileListInFlight;
  profileListInFlight = apiClient.get<ProfileApiResponse[]>('/api/profiles');
  try {
    return await profileListInFlight;
  } finally {
    profileListInFlight = null;
  }
}

export async function fetchDefaultProfile(): Promise<ProfileApiResponse> {
  if (defaultProfileInFlight) return defaultProfileInFlight;
  defaultProfileInFlight = apiClient.get<ProfileApiResponse>('/api/profiles/default');
  try {
    return await defaultProfileInFlight;
  } finally {
    defaultProfileInFlight = null;
  }
}

export async function detectPath(
  payload: PathDetectRequestApi = {},
): Promise<PathDetectResponseApi> {
  return apiClient.post<PathDetectResponseApi>('/api/path/detect', payload);
}

export async function checkPath(waypoints: PixelPointApiResponse[]): Promise<PathCheckResponseApi> {
  return apiClient.post<PathCheckResponseApi>('/api/path', { waypoints });
}

export async function populatePath(
  payload: PathPopulateRequestApi,
): Promise<PathPopulateResponseApi> {
  return apiClient.post<PathPopulateResponseApi>('/api/path/populate', payload);
}

export async function createJob(payload: CreateJobRequestApi): Promise<JobApiResponse> {
  return apiClient.post<JobApiResponse>('/api/jobs', payload);
}

export async function fetchJobs(): Promise<JobApiResponse[]> {
  if (jobsInFlight) return jobsInFlight;
  jobsInFlight = apiClient.get<JobApiResponse[]>('/api/jobs');
  try {
    return await jobsInFlight;
  } finally {
    jobsInFlight = null;
  }
}

export async function fetchLatestJob(): Promise<JobApiResponse> {
  if (latestJobInFlight) return latestJobInFlight;
  latestJobInFlight = apiClient.get<JobApiResponse>('/api/jobs/latest');
  try {
    return await latestJobInFlight;
  } finally {
    latestJobInFlight = null;
  }
}

export async function fetchJobById(jobId: string): Promise<JobApiResponse> {
  const normalizedId = jobId.trim();
  if (jobByIdInFlight.has(normalizedId)) return jobByIdInFlight.get(normalizedId)!;

  const request = apiClient.get<JobApiResponse>(`/api/jobs/${encodeURIComponent(normalizedId)}`);
  jobByIdInFlight.set(normalizedId, request);
  try {
    return await request;
  } finally {
    jobByIdInFlight.delete(normalizedId);
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  await apiClient.delete<void>(`/api/jobs/${encodeURIComponent(jobId.trim())}`);
}

export function getStreamUrl(kind: 'camera' | 'detection'): string {
  return `${apiClient.getBaseUrl()}/api/streams/${kind}/feed`;
}

export function getJobEventsUrl(jobId: string): string {
  return `${apiClient.getBaseUrl()}/api/jobs/${encodeURIComponent(jobId)}/events`;
}

export function getJobImageUrl(jobId: string): string {
  return `${apiClient.getBaseUrl()}/api/jobs/${encodeURIComponent(jobId)}/image`;
}
