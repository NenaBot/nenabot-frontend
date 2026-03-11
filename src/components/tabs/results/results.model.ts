export interface ScanRouteCoordinate {
  x: number;
  y: number;
}

export interface MeasurementPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  waypointIndex: number;
  measuredValue: number;
  comment: string;
  timestamp: string;
}

export interface ScanResult {
  scanId: string;
  createdAt: string;
  sourceName: string;
  previewImageUrl: string | null;
  routePath: ScanRouteCoordinate[];
  measurementPoints: MeasurementPoint[];
}

export interface ScanResultSummary {
  scanId: string;
  createdAt: string;
  sourceName: string;
  measurementPointCount: number;
}

export function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export function formatMeasuredValue(value: number): string {
  return value.toFixed(3);
}

export function isCriticalMeasurement(point: MeasurementPoint, threshold: number): boolean {
  return point.measuredValue > threshold;
}

export function formatNullableNumber(value: number | null, fractionDigits = 2): string {
  if (value === null) {
    return '-';
  }

  return value.toFixed(fractionDigits);
}
