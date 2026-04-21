import { getJobImageUrl, JobApiResponse } from '../apiCalls';
import {
  MeasurementPoint,
  ScanResult,
  ScanResultSummary,
  ScanRouteCoordinate,
} from '../../types/results.types';

function normalizeAxisByBounds(value: number, max: number): number {
  return normalizeAxisByRange(value, 0, max);
}

function normalizeAxisByRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return 0;
  }

  return Math.max(0, Math.min(1, (value - min) / (max - min)));
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

async function fetchJobImagePreview(jobId: string): Promise<{
  objectUrl: string | null;
  width: number | null;
  height: number | null;
}> {
  try {
    const response = await fetch(getJobImageUrl(jobId));
    if (!response.ok) {
      return { objectUrl: null, width: null, height: null };
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    if (typeof createImageBitmap !== 'function') {
      return { objectUrl, width: null, height: null };
    }

    const bitmap = await createImageBitmap(blob);
    const width = Number.isFinite(bitmap.width) ? bitmap.width : null;
    const height = Number.isFinite(bitmap.height) ? bitmap.height : null;
    bitmap.close();

    return { objectUrl, width, height };
  } catch {
    return { objectUrl: null, width: null, height: null };
  }
}

async function normalizeJobToResult(job: JobApiResponse): Promise<ScanResult> {
  const measurements = Array.isArray(job.measurements) ? job.measurements : [];
  const imagePreview = await fetchJobImagePreview(job.id);

  const xCandidates = measurements
    .map((item) => item.pixelX)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const yCandidates = measurements
    .map((item) => item.pixelY)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  const useImageDimensions =
    typeof imagePreview.width === 'number' &&
    imagePreview.width > 1 &&
    typeof imagePreview.height === 'number' &&
    imagePreview.height > 1;

  const minX = useImageDimensions ? 0 : xCandidates.length > 0 ? Math.min(...xCandidates) : 0;
  const maxX = useImageDimensions
    ? imagePreview.width! - 1
    : xCandidates.length > 0
      ? Math.max(...xCandidates)
      : 1;
  const minY = useImageDimensions ? 0 : yCandidates.length > 0 ? Math.min(...yCandidates) : 0;
  const maxY = useImageDimensions
    ? imagePreview.height! - 1
    : yCandidates.length > 0
      ? Math.max(...yCandidates)
      : 1;

  const measurementPoints: MeasurementPoint[] = measurements.map((measurement, index) => {
    const rawX = typeof measurement.pixelX === 'number' ? measurement.pixelX : 0;
    const rawY = typeof measurement.pixelY === 'number' ? measurement.pixelY : 0;

    return {
      id: `${job.id}-m-${index + 1}`,
      label: `P-${(index + 1).toString().padStart(3, '0')}`,
      x: normalizeAxisByRange(rawX, minX, maxX),
      y: normalizeAxisByRange(rawY, minY, maxY),
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
    previewImageUrl: imagePreview.objectUrl,
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

export {
  downloadContent,
  fetchJobImageObjectUrl,
  fetchJobImagePreview,
  normalizeAxisByBounds,
  normalizeJobSummary,
  normalizeJobToResult,
  toMeasurementValue,
};
