import { apiClient } from './apiClient';

function logApiCall(event: string, details: Record<string, unknown>): void {
  console.info('[RouteAPI]', event, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}

function logApiCallError(event: string, error: unknown, details: Record<string, unknown>): void {
  console.error('[RouteAPI]', event, {
    timestamp: new Date().toISOString(),
    error,
    ...details,
  });
}

function logCameraInteraction(event: string, details: Record<string, unknown>): void {
  console.info('[CameraAPI]', event, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}

function warnIfLikelyUnreachableFromBrowser(streamUrl: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const parsedUrl = new URL(streamUrl);
    const host = parsedUrl.hostname;
    const containerOnlyHosts = new Set(['backend', 'nenabot-backend']);
    const isContainerOnlyHost = containerOnlyHosts.has(host) || host.endsWith('.internal');

    if (!isContainerOnlyHost) {
      return;
    }

    console.warn('[CameraAPI] Stream host may be unreachable from browser context', {
      timestamp: new Date().toISOString(),
      streamUrl,
      browserHost: window.location.hostname,
      suggestion:
        'Use a browser-reachable API host (for example localhost or a reverse-proxy URL) for VITE_API_URL.',
    });
  } catch (error) {
    console.warn('[CameraAPI] Failed to parse stream URL for host reachability check', {
      streamUrl,
      error,
    });
  }
}

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

export interface CalibrationStatusApiResponse {
  intrinsicsLoaded?: boolean;
  checkerboardVisible?: boolean;
  calibrated?: boolean;
  lastCalibratedAt?: string | null;
}

export interface StatusApiResponse {
  status: string;
  calibration?: CalibrationStatusApiResponse | null;
}

export interface ProfileApiResponse {
  name: string;
  description?: string | null;
  workZ?: number;
  workR?: number;
  threshold?: number;
  measuringPointsPerCm?: number;
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

export interface PopulateCornerApiRequest {
  pixelX: number;
  pixelY: number;
}

export interface PopulateBatteryApiRequest {
  corners: PopulateCornerApiRequest[];
}

export interface PathPopulateRequestApi {
  // List of battery detections, each containing corner points
  batteries: PopulateBatteryApiRequest[];
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

export interface CalibrationPointApiResponse {
  pixelX: number;
  pixelY: number;
  gridRow?: number | null;
  gridCol?: number | null;
  step?: number | null;
  label?: string | null;
}

export interface CalibrationFlowResponseApi {
  ok: boolean;
  message: string;
  currentStep: number;
  totalSteps: number;
  checkerboardVisible: boolean;
  calibrated: boolean;
  lastCalibratedAt?: string | null;
  referenceImageBase64?: string | null;
  targetPoint?: CalibrationPointApiResponse | null;
  capturedPoints?: CalibrationPointApiResponse[];
}

let healthInFlight: Promise<HealthApiResponse> | null = null;
let profileListInFlight: Promise<ProfileApiResponse[]> | null = null;
let defaultProfileInFlight: Promise<ProfileApiResponse> | null = null;
let latestJobInFlight: Promise<JobApiResponse> | null = null;
let jobsInFlight: Promise<JobApiResponse[]> | null = null;
const jobByIdInFlight = new Map<string, Promise<JobApiResponse>>();

export async function fetchHealthStatus(): Promise<HealthApiResponse> {
  if (healthInFlight) return healthInFlight;
  logApiCall('fetchHealthStatus:request', {});
  healthInFlight = apiClient.get<HealthApiResponse>('/api/health');
  try {
    const response = await healthInFlight;
    logApiCall('fetchHealthStatus:response', { status: response.status });
    return response;
  } catch (error) {
    logApiCallError('fetchHealthStatus:error', error, {});
    throw error;
  } finally {
    healthInFlight = null;
  }
}

export async function fetchProfiles(): Promise<ProfileApiResponse[]> {
  if (profileListInFlight) return profileListInFlight;
  logApiCall('fetchProfiles:request', {});
  profileListInFlight = apiClient.get<ProfileApiResponse[]>('/api/profile');
  try {
    const response = await profileListInFlight;
    logApiCall('fetchProfiles:response', { profileCount: response.length });
    return response;
  } catch (error) {
    logApiCallError('fetchProfiles:error', error, {});
    throw error;
  } finally {
    profileListInFlight = null;
  }
}

export async function fetchDefaultProfile(): Promise<ProfileApiResponse> {
  if (defaultProfileInFlight) return defaultProfileInFlight;
  logApiCall('fetchDefaultProfile:request', {});
  defaultProfileInFlight = apiClient.get<ProfileApiResponse>('/api/profile/default');
  try {
    const response = await defaultProfileInFlight;
    logApiCall('fetchDefaultProfile:response', { profile: response.name });
    return response;
  } catch (error) {
    logApiCallError('fetchDefaultProfile:error', error, {});
    throw error;
  } finally {
    defaultProfileInFlight = null;
  }
}

export async function fetchStatusRoute(): Promise<StatusApiResponse> {
  logApiCall('fetchStatusRoute:request', {});
  try {
    const response = await apiClient.get<StatusApiResponse>('/api/status');
    logApiCall('fetchStatusRoute:response', {
      status: response.status,
      hasCalibration: Boolean(response.calibration),
    });
    return response;
  } catch (error) {
    logApiCallError('fetchStatusRoute:error', error, {});
    throw error;
  }
}

export async function detectPath(
  payload: PathDetectRequestApi = {},
): Promise<PathDetectResponseApi> {
  logApiCall('detectPath:request', {
    optionKeys: Object.keys(payload.options ?? {}),
  });

  try {
    const response = await apiClient.post<PathDetectResponseApi>('/api/path/detect', payload);
    logApiCall('detectPath:response', {
      ok: response.ok,
      detectionCount: response.detections?.length ?? 0,
      hasImage: Boolean(response.image_base64),
    });
    return response;
  } catch (error) {
    logApiCallError('detectPath:error', error, {
      optionKeys: Object.keys(payload.options ?? {}),
    });
    throw error;
  }
}

export async function populatePath(
  payload: PathPopulateRequestApi,
): Promise<PathPopulateResponseApi> {
  logApiCall('populatePath:request', {
    batteryCount: payload.batteries.length,
    measuringPointsPerCm: payload.measuringPointsPerCm,
  });

  try {
    const response = await apiClient.post<PathPopulateResponseApi>('/api/path/populate', payload);
    logApiCall('populatePath:response', {
      pointCount: response.path.length,
    });
    return response;
  } catch (error) {
    logApiCallError('populatePath:error', error, {
      batteryCount: payload.batteries.length,
      measuringPointsPerCm: payload.measuringPointsPerCm,
    });
    throw error;
  }
}

export async function createJob(payload: CreateJobRequestApi): Promise<JobApiResponse> {
  // POST /api/job creates a new job and starts it
  logApiCall('createJob:request', {
    pathLength: payload.path.length,
    dryRun: payload.dryRun,
    workZ: payload.workZ,
    workR: payload.workR,
  });

  try {
    const response = await apiClient.post<JobApiResponse>('/api/job', payload);
    logApiCall('createJob:response', { jobId: response.id });
    return response;
  } catch (error) {
    logApiCallError('createJob:error', error, {
      pathLength: payload.path.length,
      dryRun: payload.dryRun,
      workZ: payload.workZ,
      workR: payload.workR,
    });
    throw error;
  }
}

export async function fetchJobs(): Promise<JobApiResponse[]> {
  if (jobsInFlight) return jobsInFlight;
  logApiCall('fetchJobs:request', {});
  jobsInFlight = apiClient.get<JobApiResponse[]>('/api/job');
  try {
    const response = await jobsInFlight;
    logApiCall('fetchJobs:response', { jobCount: response.length });
    return response;
  } catch (error) {
    logApiCallError('fetchJobs:error', error, {});
    throw error;
  } finally {
    jobsInFlight = null;
  }
}

export async function fetchLatestJob(): Promise<JobApiResponse> {
  if (latestJobInFlight) return latestJobInFlight;
  logApiCall('fetchLatestJob:request', {});
  latestJobInFlight = apiClient.get<JobApiResponse>('/api/job/latest');
  try {
    const response = await latestJobInFlight;
    logApiCall('fetchLatestJob:response', { jobId: response.id });
    return response;
  } catch (error) {
    logApiCallError('fetchLatestJob:error', error, {});
    throw error;
  } finally {
    latestJobInFlight = null;
  }
}

export async function fetchJobById(jobId: string): Promise<JobApiResponse> {
  const normalizedId = jobId.trim();
  if (jobByIdInFlight.has(normalizedId)) return jobByIdInFlight.get(normalizedId)!;

  logApiCall('fetchJobById:request', { jobId: normalizedId });
  const request = apiClient.get<JobApiResponse>(`/api/job/${encodeURIComponent(normalizedId)}`);
  jobByIdInFlight.set(normalizedId, request);
  try {
    const response = await request;
    logApiCall('fetchJobById:response', { jobId: response.id });
    return response;
  } catch (error) {
    logApiCallError('fetchJobById:error', error, { jobId: normalizedId });
    throw error;
  } finally {
    jobByIdInFlight.delete(normalizedId);
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  await apiClient.delete<void>(`/api/job/${encodeURIComponent(jobId.trim())}`);
}

export async function calibrationStart(): Promise<CalibrationFlowResponseApi> {
  logApiCall('calibration start', {});
  const response = await apiClient.post<CalibrationFlowResponseApi>('/api/calibration', {
    action: 'start',
  });
  logApiCall('calibration start success', {
    ok: response.ok,
    currentStep: response.currentStep,
    checkerboardVisible: response.checkerboardVisible,
  });
  return response;
}

export async function calibrationCapture(): Promise<CalibrationFlowResponseApi> {
  logApiCall('calibration capture', {});
  const response = await apiClient.post<CalibrationFlowResponseApi>('/api/calibration', {
    action: 'capture',
  });
  logApiCall('calibration capture success', {
    ok: response.ok,
    currentStep: response.currentStep,
    calibrated: response.calibrated,
  });
  return response;
}

export function getStreamUrl(kind: 'camera' | 'detection'): string {
  const baseUrl = apiClient.getBaseUrl();
  const streamUrl = `${baseUrl}/api/stream/${kind}/feed`;

  logCameraInteraction('Resolved camera stream URL', {
    kind,
    baseUrl,
    streamUrl,
  });
  warnIfLikelyUnreachableFromBrowser(streamUrl);

  return streamUrl;
}

export function getJobEventsUrl(jobId: string): string {
  return `${apiClient.getBaseUrl()}/api/job/${encodeURIComponent(jobId)}/events`;
}

export function getJobImageUrl(jobId: string): string {
  return `${apiClient.getBaseUrl()}/api/job/${encodeURIComponent(jobId)}/image`;
}
