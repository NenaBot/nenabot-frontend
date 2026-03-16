import {
  downloadScanResult,
  fetchAvailableScanResults,
  fetchLatestScanResult,
  fetchScanResultById,
  MeasurementPointApiResponse,
  RouteCoordinateApiResponse,
  ScanResultApiResponse,
  ScanResultExportFormat,
  ScanResultSummaryApiResponse,
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

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

function normalizeCoordinate(raw: number | undefined): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return 0;
  }

  if (raw > 1) {
    return Math.max(0, Math.min(1, raw / 100));
  }

  return Math.max(0, Math.min(1, raw));
}

function normalizeRouteCoordinate(point: RouteCoordinateApiResponse): ScanRouteCoordinate {
  return {
    x: normalizeCoordinate(point.x),
    y: normalizeCoordinate(point.y),
  };
}

function normalizeMeasurementPoint(
  point: MeasurementPointApiResponse,
  index: number,
): MeasurementPoint {
  return {
    id:
      typeof point.id === 'string' || typeof point.id === 'number'
        ? String(point.id)
        : `mp-${index + 1}`,
    label:
      typeof point.label === 'string' && point.label.trim().length > 0
        ? point.label
        : `P-${index + 1}`,
    x: normalizeCoordinate(point.x),
    y: normalizeCoordinate(point.y),
    waypointIndex:
      typeof point.waypointIndex === 'number' && Number.isFinite(point.waypointIndex)
        ? Math.max(0, Math.round(point.waypointIndex))
        : index + 1,
    measuredValue:
      typeof point.measuredValue === 'number' && Number.isFinite(point.measuredValue)
        ? point.measuredValue
        : typeof point.intensity === 'number' && Number.isFinite(point.intensity)
          ? point.intensity
          : 0,
    comment: typeof point.comment === 'string' ? point.comment : '',
    timestamp: typeof point.timestamp === 'string' ? point.timestamp : '',
  };
}

function normalizeScanResult(response: ScanResultApiResponse): ScanResult {
  const measurementPoints = Array.isArray(response.measurementPoints)
    ? response.measurementPoints.map(normalizeMeasurementPoint)
    : [];

  const routePathSource =
    Array.isArray(response.routePath) && response.routePath.length > 0
      ? response.routePath
      : measurementPoints.map((point) => ({ x: point.x, y: point.y }));

  return {
    scanId:
      typeof response.scanId === 'string' && response.scanId.trim().length > 0
        ? response.scanId
        : 'unknown-scan',
    createdAt:
      typeof response.createdAt === 'string' ? response.createdAt : new Date().toISOString(),
    sourceName:
      typeof response.sourceName === 'string' && response.sourceName.trim().length > 0
        ? response.sourceName
        : 'Latest scan',
    previewImageUrl: typeof response.previewImageUrl === 'string' ? response.previewImageUrl : null,
    routePath: routePathSource.map(normalizeRouteCoordinate),
    measurementPoints,
  };
}

function normalizeScanSummary(response: ScanResultSummaryApiResponse): ScanResultSummary {
  return {
    scanId:
      typeof response.scanId === 'string' && response.scanId.trim().length > 0
        ? response.scanId
        : 'unknown-scan',
    createdAt:
      typeof response.createdAt === 'string' ? response.createdAt : new Date().toISOString(),
    sourceName:
      typeof response.sourceName === 'string' && response.sourceName.trim().length > 0
        ? response.sourceName
        : 'Uploaded scan',
    measurementPointCount:
      typeof response.measurementPointCount === 'number' &&
      Number.isFinite(response.measurementPointCount)
        ? Math.max(0, Math.round(response.measurementPointCount))
        : 0,
  };
}

export async function getAvailableScanResultSummaries(): Promise<ScanResultSummary[]> {
  if (USE_MOCK_DATA) {
    return getMockScanResultSummaries();
  }

  const response = await fetchAvailableScanResults();
  return response.map(normalizeScanSummary);
}

export async function getLatestScanResult(): Promise<ScanResult> {
  if (USE_MOCK_DATA) {
    return getMockLatestScanResult();
  }

  const response = await fetchLatestScanResult();
  return normalizeScanResult(response);
}

export async function getScanResult(scanId: string): Promise<ScanResult> {
  if (USE_MOCK_DATA) {
    return getMockScanResultById(scanId);
  }

  const response = await fetchScanResultById(scanId);
  return normalizeScanResult(response);
}

export async function exportScanResult(
  scanId: string,
  format: ScanResultExportFormat,
): Promise<void> {
  const blob = await downloadScanResult(scanId, format);
  const extension = format === 'csv' ? 'csv' : 'json';
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${scanId}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
