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
  ionvision: ComponentHealthApiResponse;
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
  corners?: { x?: number; y?: number; pixelX?: number; pixelY?: number }[];
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

// Battery corners schema for path population
export interface BatteryCornersApiResponse {
  corners: PixelPointApiResponse[];
}

export interface PathPopulateRequestApi {
  // List of battery detections, each containing corner points
  batteries: BatteryCornersApiResponse[];
  // Measurement density: number of interpolated points per cm between corners [0, 10]
  measuringPointsPerCm: number;
  options?: Record<string, unknown> | null;
}

// Response point from path population - includes metadata for job creation
export interface PathPopulatePointApiResponse {
  // Sequential identifier for the point
  index: string;
  // Battery/detection number (0-based)
  batteryNr: number;
  // Corner index within the battery
  cornerIndex: number;
  // Measurement point index within the populated path
  measurementIndex: number;
  // Pixel coordinates
  pixelX: number;
  pixelY: number;
}

export interface PathPopulateResponseApi {
  path: PathPopulatePointApiResponse[];
}

// Job path point with full metadata for backend processing
export interface JobPathPointApiResponse {
  pixelX: number;
  pixelY: number;
  index?: string | null;
  batteryNr?: number | null;
  cornerIndex?: number | null;
  measurementIndex?: number | null;
}

export interface CreateJobRequestApi {
  path: JobPathPointApiResponse[];
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
  profileListInFlight = apiClient.get<ProfileApiResponse[]>('/api/profile');
  try {
    return await profileListInFlight;
  } finally {
    profileListInFlight = null;
  }
}

export async function fetchDefaultProfile(): Promise<ProfileApiResponse> {
  if (defaultProfileInFlight) return defaultProfileInFlight;
  defaultProfileInFlight = apiClient.get<ProfileApiResponse>('/api/profile/default');
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

export async function populatePath(
  payload: PathPopulateRequestApi,
): Promise<PathPopulateResponseApi> {
  return apiClient.post<PathPopulateResponseApi>('/api/path/populate', payload);
}

export async function createJob(payload: CreateJobRequestApi): Promise<JobApiResponse> {
  // POST /api/job creates a new job and starts it
  return apiClient.post<JobApiResponse>('/api/job', payload);
}

export async function fetchJobs(): Promise<JobApiResponse[]> {
  if (jobsInFlight) return jobsInFlight;
  jobsInFlight = apiClient.get<JobApiResponse[]>('/api/job');
  try {
    return await jobsInFlight;
  } finally {
    jobsInFlight = null;
  }
}

export async function fetchLatestJob(): Promise<JobApiResponse> {
  if (latestJobInFlight) return latestJobInFlight;
  latestJobInFlight = apiClient.get<JobApiResponse>('/api/job/latest');
  try {
    return await latestJobInFlight;
  } finally {
    latestJobInFlight = null;
  }
}

export async function fetchJobById(jobId: string): Promise<JobApiResponse> {
  const normalizedId = jobId.trim();
  if (jobByIdInFlight.has(normalizedId)) return jobByIdInFlight.get(normalizedId)!;

  const request = apiClient.get<JobApiResponse>(`/api/job/${encodeURIComponent(normalizedId)}`);
  jobByIdInFlight.set(normalizedId, request);
  try {
    return await request;
  } finally {
    jobByIdInFlight.delete(normalizedId);
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  await apiClient.delete<void>(`/api/job/${encodeURIComponent(jobId.trim())}`);
}

export function getStreamUrl(kind: 'camera' | 'detection'): string {
  return `${apiClient.getBaseUrl()}/api/stream/${kind}/feed`;
}

export function getJobEventsUrl(jobId: string): string {
  return `${apiClient.getBaseUrl()}/api/job/${encodeURIComponent(jobId)}/events`;
}

export function getJobImageUrl(jobId: string): string {
  return `${apiClient.getBaseUrl()}/api/job/${encodeURIComponent(jobId)}/image`;
}
