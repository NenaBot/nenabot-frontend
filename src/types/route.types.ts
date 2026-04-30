/**
 * Type definitions for route planning and waypoint management.
 *
 * Defines interfaces for route settings, coordinates, and waypoint data
 * used in route planning and preview functionality.
 */
export interface RouteSettings {
  alwaysScanOnWaypoints: boolean;
  pointsPerCm: number;
}

export interface RouteEstimate {
  measurementPoints: number;
  estimatedSeconds: number;
}

export interface RoutePlan {
  settings: RouteSettings;
  estimate: RouteEstimate;
}

export interface RouteEstimateBasis {
  pointsPerCm: number;
  estimate: RouteEstimate;
}

export interface RouteTabState {
  isLoadingDefaultPlan: boolean;
  loadError: string | null;
  pointsPerCmInput: string;
  pointsPerCmError: string | null;
  plan: RoutePlan;
  estimateBasis: RouteEstimateBasis;
}

export const POINTS_PER_CM_MIN_EXCLUSIVE = 0;
export const POINTS_PER_CM_MAX_EXCLUSIVE = 100;
export const POINTS_PER_CM_INPUT_MIN = POINTS_PER_CM_MIN_EXCLUSIVE;
export const POINTS_PER_CM_INPUT_MAX = POINTS_PER_CM_MAX_EXCLUSIVE;

// Measurement density (for path population API)
export const MEASUREMENT_DENSITY_MIN = 0;
export const MEASUREMENT_DENSITY_MAX = 10;

export const ROUTE_ESTIMATE_STARTUP_SECONDS = 10;
export const ROUTE_ESTIMATE_SECONDS_PER_POINT = 1.5;

const DEFAULT_POINTS_PER_CM = 25;
const DEFAULT_ESTIMATE_POINTS = 2500;
const DEFAULT_ESTIMATE_SECONDS = estimateRouteDurationSeconds(DEFAULT_ESTIMATE_POINTS);

export function estimateRouteDurationSeconds(points: number): number {
  const normalizedPoints = Math.max(0, points);
  return Math.max(
    0,
    Math.round(
      ROUTE_ESTIMATE_STARTUP_SECONDS + normalizedPoints * ROUTE_ESTIMATE_SECONDS_PER_POINT,
    ),
  );
}

export function createDefaultRoutePlan(): RoutePlan {
  return {
    settings: {
      alwaysScanOnWaypoints: true,
      pointsPerCm: DEFAULT_POINTS_PER_CM,
    },
    estimate: {
      measurementPoints: DEFAULT_ESTIMATE_POINTS,
      estimatedSeconds: DEFAULT_ESTIMATE_SECONDS,
    },
  };
}

export function createRouteTabInitialState(): RouteTabState {
  const defaultPlan = createDefaultRoutePlan();

  return {
    isLoadingDefaultPlan: true,
    loadError: null,
    pointsPerCmInput: defaultPlan.settings.pointsPerCm.toString(),
    pointsPerCmError: null,
    plan: defaultPlan,
    estimateBasis: {
      pointsPerCm: defaultPlan.settings.pointsPerCm,
      estimate: defaultPlan.estimate,
    },
  };
}

export function getPointsPerCmValidationError(value: string): string | null {
  if (value.trim().length === 0) {
    return 'Points per cm is required.';
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 'Points per cm must be a number.';
  }

  if (parsed < POINTS_PER_CM_MIN_EXCLUSIVE || parsed >= POINTS_PER_CM_MAX_EXCLUSIVE) {
    return 'Enter 0 or a positive number less than 100.';
  }

  return null;
}

export function getMeasurementDensityValidationError(value: string): string | null {
  if (value.trim().length === 0) {
    return 'Measurement density is required.';
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 'Measurement density must be a number.';
  }

  if (parsed < MEASUREMENT_DENSITY_MIN || parsed > MEASUREMENT_DENSITY_MAX) {
    return `Enter a value between ${MEASUREMENT_DENSITY_MIN} and ${MEASUREMENT_DENSITY_MAX}.`;
  }

  return null;
}

export function isMeasurementDensityInRange(value: number): boolean {
  return value >= MEASUREMENT_DENSITY_MIN && value <= MEASUREMENT_DENSITY_MAX;
}

export function parsePointsPerCm(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function deriveEstimateFromBasis(
  pointsPerCm: number,
  basis: RouteEstimateBasis,
): RouteEstimate {
  if (basis.pointsPerCm <= 0) {
    return basis.estimate;
  }

  const ratio = pointsPerCm / basis.pointsPerCm;

  return {
    measurementPoints: Math.max(1, Math.round(basis.estimate.measurementPoints * ratio)),
    estimatedSeconds: Math.max(1, Math.round(basis.estimate.estimatedSeconds * ratio)),
  };
}

export function formatMeasurementPoints(points: number): string {
  return points.toLocaleString();
}

export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds}s`;
  }

  const minutes = Math.round(seconds / 60);
  return `~${minutes} minute${minutes === 1 ? '' : 's'}`;
}
