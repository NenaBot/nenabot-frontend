import { HardwareData } from '../types/hardware.types';
import { APIError } from './apiClient';
import { apiClient } from './apiClient';

export type HardwareStatusApiResponse = {
  spectrometer: (Omit<HardwareData, 'lastUpdate'> & { lastUpdate: string | Date }) | null;
  camera: (Omit<HardwareData, 'lastUpdate'> & { lastUpdate: string | Date }) | null;
  robotarm: (Omit<HardwareData, 'lastUpdate'> & { lastUpdate: string | Date }) | null;
};

export interface DefaultRoutePlanApiResponse {
  alwaysScanOnWaypoints?: boolean;
  pointsPerCm?: number;
  estimatedMeasurementPoints?: number;
  estimatedSeconds?: number;
}

export interface RouteCoordinateApiResponse {
  x?: number;
  y?: number;
}

export interface MeasurementPointApiResponse {
  id?: string | number;
  label?: string;
  x?: number;
  y?: number;
  waypointIndex?: number;
  measuredValue?: number;
  comment?: string;
  wavelengthNm?: number;
  intensity?: number;
  voltageV?: number;
  temperatureC?: number;
  timestamp?: string;
}

export interface ScanResultApiResponse {
  scanId?: string;
  createdAt?: string;
  sourceName?: string;
  previewImageUrl?: string | null;
  routePath?: RouteCoordinateApiResponse[];
  measurementPoints?: MeasurementPointApiResponse[];
}

export interface ScanResultSummaryApiResponse {
  scanId?: string;
  createdAt?: string;
  sourceName?: string;
  measurementPointCount?: number;
}

export type ScanResultExportFormat = 'json' | 'csv';

let hardwareStatusInFlight: Promise<HardwareStatusApiResponse> | null = null;
let defaultRoutePlanInFlight: Promise<DefaultRoutePlanApiResponse> | null = null;
let scanResultsInFlight: Promise<ScanResultSummaryApiResponse[]> | null = null;
let latestScanResultInFlight: Promise<ScanResultApiResponse> | null = null;
const scanResultByIdInFlight = new Map<string, Promise<ScanResultApiResponse>>();

export async function fetchHardwareStatus(): Promise<HardwareStatusApiResponse> {
  if (hardwareStatusInFlight) {
    return hardwareStatusInFlight;
  }

  hardwareStatusInFlight = apiClient.get<HardwareStatusApiResponse>('/api/hardware/status');

  try {
    return await hardwareStatusInFlight;
  } finally {
    hardwareStatusInFlight = null;
  }
}

export async function fetchDefaultRoutePlan(): Promise<DefaultRoutePlanApiResponse> {
  if (defaultRoutePlanInFlight) {
    return defaultRoutePlanInFlight;
  }

  defaultRoutePlanInFlight = apiClient.get<DefaultRoutePlanApiResponse>('/api/route/default');

  try {
    return await defaultRoutePlanInFlight;
  } finally {
    defaultRoutePlanInFlight = null;
  }
}

export function getCameraStreamUrl(): string {
  return apiClient.getVideoStreamUrl();
}

export async function fetchAvailableScanResults(): Promise<ScanResultSummaryApiResponse[]> {
  if (scanResultsInFlight) {
    return scanResultsInFlight;
  }

  scanResultsInFlight = apiClient.get<ScanResultSummaryApiResponse[]>('/api/results');

  try {
    return await scanResultsInFlight;
  } finally {
    scanResultsInFlight = null;
  }
}

export async function fetchLatestScanResult(): Promise<ScanResultApiResponse> {
  if (latestScanResultInFlight) {
    return latestScanResultInFlight;
  }

  latestScanResultInFlight = apiClient.get<ScanResultApiResponse>('/api/results/latest');

  try {
    return await latestScanResultInFlight;
  } finally {
    latestScanResultInFlight = null;
  }
}

export async function fetchScanResultById(scanId: string): Promise<ScanResultApiResponse> {
  const normalizedId = scanId.trim();

  if (scanResultByIdInFlight.has(normalizedId)) {
    return scanResultByIdInFlight.get(normalizedId)!;
  }

  const request = apiClient.get<ScanResultApiResponse>(
    `/api/results/${encodeURIComponent(normalizedId)}`,
  );
  scanResultByIdInFlight.set(normalizedId, request);

  try {
    return await request;
  } finally {
    scanResultByIdInFlight.delete(normalizedId);
  }
}

export async function downloadScanResult(
  scanId: string,
  format: ScanResultExportFormat,
): Promise<Blob> {
  const normalizedId = scanId.trim();
  const endpoint = `/api/results/${encodeURIComponent(normalizedId)}/export?format=${encodeURIComponent(format)}`;
  const response = await fetch(`${apiClient.getBaseUrl()}${endpoint}`);

  if (!response.ok) {
    throw new APIError(
      response.status,
      'EXPORT_FAILED',
      `Failed to export scan result ${normalizedId}.`,
    );
  }

  return response.blob();
}
