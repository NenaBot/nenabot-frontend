import {
  fetchJobById,
  fetchJobs,
  fetchLatestJob,
  getJobImageUrl,
  JobApiResponse,
} from './apiCalls';
import {
  getMockLatestScanResult,
  getMockScanResultById,
  getMockScanResultSummaries,
} from '../mocks/scanResultsMocks';
import {
  MeasurementPoint,
  ScanResult,
  ScanResultSummary,
  ScanRouteCoordinate,
} from '../types/results.types';
import { isMockModeEnabled } from '../state/mockMode';

function normalizeAxisByBounds(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, value / max));
}

function toMeasurementValue(scanResult: Record<string, unknown> | null | undefined): number {
  if (!scanResult || typeof scanResult !== 'object') {
    return 0;
  }

  const numericCandidateKeys = ['measuredValue', 'value', 'intensity', 'signal'];
  for (const key of numericCandidateKeys) {
    const value = scanResult[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

async function fetchJobImageObjectUrl(jobId: string): Promise<string | null> {
  try {
    const response = await fetch(getJobImageUrl(jobId));
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

async function normalizeJobToResult(job: JobApiResponse): Promise<ScanResult> {
  const measurements = Array.isArray(job.measurements) ? job.measurements : [];
  const xCandidates = measurements.map((item) => item.pixelX ?? 0);
  const yCandidates = measurements.map((item) => item.pixelY ?? 0);
  const maxX = Math.max(1, ...xCandidates);
  const maxY = Math.max(1, ...yCandidates);

  const measurementPoints: MeasurementPoint[] = measurements.map((measurement, index) => {
    const rawX = typeof measurement.pixelX === 'number' ? measurement.pixelX : 0;
    const rawY = typeof measurement.pixelY === 'number' ? measurement.pixelY : 0;

    return {
      id: `${job.id}-m-${index + 1}`,
      label: `P-${(index + 1).toString().padStart(3, '0')}`,
      x: normalizeAxisByBounds(rawX, maxX),
      y: normalizeAxisByBounds(rawY, maxY),
      waypointIndex:
        typeof measurement.waypointIndex === 'number' && Number.isFinite(measurement.waypointIndex)
          ? measurement.waypointIndex
          : index + 1,
      measuredValue: toMeasurementValue(measurement.scanResult),
      comment: measurement.simulated ? 'Simulated' : '',
      timestamp: measurement.timestamp ?? '',
    };
  });

  const routePath: ScanRouteCoordinate[] = measurementPoints.map((point) => ({
    x: point.x,
    y: point.y,
  }));

  return {
    scanId: job.id,
    createdAt: new Date().toISOString(),
    sourceName: job.options?.profile ? String(job.options.profile) : `Job ${job.id}`,
    previewImageUrl: await fetchJobImageObjectUrl(job.id),
    routePath,
    measurementPoints,
  };
}

function normalizeJobSummary(job: JobApiResponse): ScanResultSummary {
  return {
    scanId: job.id,
    createdAt: new Date().toISOString(),
    sourceName: job.options?.profile ? String(job.options.profile) : `Job ${job.id}`,
    measurementPointCount: Array.isArray(job.measurements) ? job.measurements.length : 0,
  };
}

export async function getAvailableScanResultSummaries(): Promise<ScanResultSummary[]> {
  if (isMockModeEnabled()) {
    return getMockScanResultSummaries();
  }

  const response = await fetchJobs();
  return response.map(normalizeJobSummary);
}

export async function getLatestScanResult(): Promise<ScanResult> {
  if (isMockModeEnabled()) {
    return getMockLatestScanResult();
  }

  const response = await fetchLatestJob();
  return normalizeJobToResult(response);
}

export async function getScanResult(scanId: string): Promise<ScanResult> {
  if (isMockModeEnabled()) {
    return getMockScanResultById(scanId);
  }

  const response = await fetchJobById(scanId);
  return normalizeJobToResult(response);
}

function downloadContent(scanId: string, extension: 'json' | 'csv', content: string) {
  const blob = new Blob([content], {
    type: extension === 'json' ? 'application/json' : 'text/csv',
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${scanId}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function exportScanResult(scanId: string, format: 'json' | 'csv'): Promise<void> {
  const result = await getScanResult(scanId);

  if (format === 'json') {
    downloadContent(scanId, 'json', JSON.stringify(result, null, 2));
    return;
  }

  const header = [
    'id',
    'label',
    'x',
    'y',
    'waypointIndex',
    'measuredValue',
    'comment',
    'timestamp',
  ];
  const rows = result.measurementPoints.map((point) =>
    [
      point.id,
      point.label,
      point.x,
      point.y,
      point.waypointIndex,
      point.measuredValue,
      point.comment,
      point.timestamp,
    ].join(','),
  );
  downloadContent(scanId, 'csv', [header.join(','), ...rows].join('\n'));
}
