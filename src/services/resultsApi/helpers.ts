import { getJobImageUrl, JobApiResponse } from '../apiCalls';
import {
  MeasurementPoint,
  ScanResult,
  ScanResultSummary,
  ScanRouteCoordinate,
} from '../../types/results.types';

const DEFAULT_IMAGE_WIDTH = 1280;
const DEFAULT_IMAGE_HEIGHT = 720;
const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

interface JobImagePreview {
  objectUrl: string;
  width: number | null;
  height: number | null;
}

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

function parsePngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (
    bytes.length < 24 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47 ||
    bytes[12] !== 0x49 ||
    bytes[13] !== 0x48 ||
    bytes[14] !== 0x44 ||
    bytes[15] !== 0x52
  ) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width > 0 && height > 0 ? { width, height } : null;
}

function parseJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }

    if (offset >= bytes.length) {
      return null;
    }

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      return null;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    if (offset + 1 >= bytes.length) {
      return null;
    }

    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      return null;
    }

    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < 7) {
        return null;
      }

      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      return width > 0 && height > 0 ? { width, height } : null;
    }

    offset += segmentLength;
  }

  return null;
}

function readBlobBytes(blob: Blob): Promise<ArrayBuffer> {
  const blobWithArrayBuffer = blob as Blob & {
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };

  if (typeof blobWithArrayBuffer.arrayBuffer === 'function') {
    return blobWithArrayBuffer.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read image bytes'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read image bytes'));
    reader.readAsArrayBuffer(blob);
  });
}

async function readImageDimensionsFromBlob(
  blob: Blob,
): Promise<{ width: number; height: number } | null> {
  try {
    const bytes = new Uint8Array(await readBlobBytes(blob));
    return parsePngDimensions(bytes) ?? parseJpegDimensions(bytes);
  } catch {
    return null;
  }
}

async function fetchJobImagePreview(jobId: string): Promise<JobImagePreview | null> {
  try {
    const response = await fetch(getJobImageUrl(jobId));
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const dimensions = await readImageDimensionsFromBlob(blob);
    return {
      objectUrl: URL.createObjectURL(blob),
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchJobImageObjectUrl(jobId: string): Promise<string | null> {
  const preview = await fetchJobImagePreview(jobId);
  return preview?.objectUrl ?? null;
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
  const optionDimensions = resolveResultImageDimensions(job);
  const imagePreview = await fetchJobImagePreview(job.id);
  const imageWidth = imagePreview?.width ?? optionDimensions.width;
  const imageHeight = imagePreview?.height ?? optionDimensions.height;
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
    previewImageUrl: imagePreview?.objectUrl ?? null,
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
  fetchJobImagePreview,
  normalizeAxisByBounds,
  normalizeJobSummary,
  normalizeJobToResult,
  readImageDimensionsFromBlob,
  resolveResultImageDimensions,
  toMeasurementValue,
};
