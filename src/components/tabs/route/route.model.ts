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

const DEFAULT_POINTS_PER_CM = 25;
const DEFAULT_ESTIMATE_SECONDS = 12 * 60;
const DEFAULT_ESTIMATE_POINTS = 2500;

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

  if (parsed <= POINTS_PER_CM_MIN_EXCLUSIVE || parsed >= POINTS_PER_CM_MAX_EXCLUSIVE) {
    return 'Enter a number greater than 0 and less than 100.';
  }

  return null;
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
