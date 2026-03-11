import { HardwareData } from '../types/hardware.types';
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

let hardwareStatusInFlight: Promise<HardwareStatusApiResponse> | null = null;
let defaultRoutePlanInFlight: Promise<DefaultRoutePlanApiResponse> | null = null;

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
