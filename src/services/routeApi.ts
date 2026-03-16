import { DefaultRoutePlanApiResponse, fetchDefaultRoutePlan } from './apiCalls';
import { createDefaultRoutePlan, RoutePlan } from '../types/route.types';

function normalizeDefaultRoutePlanResponse(response: DefaultRoutePlanApiResponse): RoutePlan {
  const fallback = createDefaultRoutePlan();

  return {
    settings: {
      alwaysScanOnWaypoints:
        typeof response.alwaysScanOnWaypoints === 'boolean'
          ? response.alwaysScanOnWaypoints
          : fallback.settings.alwaysScanOnWaypoints,
      pointsPerCm:
        typeof response.pointsPerCm === 'number' && Number.isFinite(response.pointsPerCm)
          ? response.pointsPerCm
          : fallback.settings.pointsPerCm,
    },
    estimate: {
      measurementPoints:
        typeof response.estimatedMeasurementPoints === 'number' &&
        Number.isFinite(response.estimatedMeasurementPoints)
          ? Math.max(1, Math.round(response.estimatedMeasurementPoints))
          : fallback.estimate.measurementPoints,
      estimatedSeconds:
        typeof response.estimatedSeconds === 'number' && Number.isFinite(response.estimatedSeconds)
          ? Math.max(1, Math.round(response.estimatedSeconds))
          : fallback.estimate.estimatedSeconds,
    },
  };
}

export async function getDefaultRoutePlan(): Promise<RoutePlan> {
  const response = await fetchDefaultRoutePlan();
  return normalizeDefaultRoutePlanResponse(response);
}
