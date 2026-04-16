import { getJobImageUrl, JobApiResponse } from '../apiCalls';
import {
  MeasurementPoint,
  ScanResult,
  ScanResultSummary,
  ScanRouteCoordinate,
} from '../../types/results.types';

const DEFAULT_IMAGE_WIDTH = 1280;
const DEFAULT_IMAGE_HEIGHT = 720;

function normalizeAxisByBounds(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, value / max));
}

function averageTopIntensities(values: unknown): number | null {
  if (!Array.isArray(values)) {
    return null;
  }

  const numericValues = values
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .sort((a, b) => b - a)
    .slice(0, 3);

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function toMeasurementValue(scanResult: Record<string, unknown> | null | undefined): number {
  if (!scanResult || typeof scanResult !== 'object') {
    return 0;
  }

  const evaluation = scanResult.evaluation;
  if (evaluation && typeof evaluation === 'object') {
    const intensityTopAverage = (evaluation as { intensityTopAverage?: unknown })
      .intensityTopAverage;
    if (typeof intensityTopAverage === 'number' && Number.isFinite(intensityTopAverage)) {
      return intensityTopAverage;
    }

    const intensityAverage = (evaluation as { intensity_average?: unknown }).intensity_average;
    if (typeof intensityAverage === 'number' && Number.isFinite(intensityAverage)) {
      return intensityAverage;
    }

    const evaluationTopAverage = averageTopIntensities(
      (evaluation as { intensityTop?: unknown }).intensityTop,
    );
    if (evaluationTopAverage !== null) {
      return evaluationTopAverage;
    }
  }

  const bodyTopAverage = averageTopIntensities(
    (
      scanResult as {
        body?: {
          measurementData?: {
            intensityTop?: unknown;
          };
        };
      }
    ).body?.measurementData?.intensityTop,
  );
  if (bodyTopAverage !== null) {
    return bodyTopAverage;
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

function readDimensionCandidate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function resolveResultImageDimensions(job: JobApiResponse): { width: number; height: number } {
  const options = job.options ?? {};

  const optionWidthKeys = ['imageWidth', 'frameWidth', 'cameraWidth', 'snapshotWidth', 'width'];
  const optionHeightKeys = [
    'imageHeight',
    'frameHeight',
    'cameraHeight',
    'snapshotHeight',
    'height',
  ];

  let width: number | null = null;
  let height: number | null = null;

  for (const key of optionWidthKeys) {
    if (key in options) {
      width = readDimensionCandidate(options[key]);
    }
    if (width !== null) {
      break;
    }
  }

  for (const key of optionHeightKeys) {
    if (key in options) {
      height = readDimensionCandidate(options[key]);
    }
    if (height !== null) {
      break;
    }
  }

  const resolutionValue = options.resolution;
  if (
    (width === null || height === null) &&
    Array.isArray(resolutionValue) &&
    resolutionValue.length >= 2
  ) {
    const candidateWidth = readDimensionCandidate(resolutionValue[0]);
    const candidateHeight = readDimensionCandidate(resolutionValue[1]);
    if (width === null) {
      width = candidateWidth;
    }
    if (height === null) {
      height = candidateHeight;
    }
  }

  return {
    width: width ?? DEFAULT_IMAGE_WIDTH,
    height: height ?? DEFAULT_IMAGE_HEIGHT,
  };
}

async function normalizeJobToResult(job: JobApiResponse): Promise<ScanResult> {
  const measurements = Array.isArray(job.measurements) ? job.measurements : [];
  const { width: imageWidth, height: imageHeight } = resolveResultImageDimensions(job);
  const maxX = Math.max(1, imageWidth);
  const maxY = Math.max(1, imageHeight);

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
      rawScanResult: measurement.scanResult ?? null,
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
    imageWidth,
    imageHeight,
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
  normalizeAxisByBounds,
  normalizeJobSummary,
  normalizeJobToResult,
  resolveResultImageDimensions,
  toMeasurementValue,
};
