import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createJob,
  detectPath,
  PathItemApiResponse,
  PathPopulatePointApiResponse,
  populatePath,
  PixelPointApiResponse,
  BatteryCornersApiResponse,
  JobPathPointApiResponse,
} from '../services/apiCalls';
import { ProfileModel } from '../types/profile.types';
import { isMockModeEnabled } from '../state/mockMode';
import { RoutePreviewCoordinate, RoutePreviewPoint } from '../types/routePreview.types';

interface UseRoutePlanOptions {
  selectedProfile: ProfileModel | null;
}

interface DetectState {
  isInitializing: boolean;
  isPopulating: boolean;
  isCreatingJob: boolean;
  dryRun: boolean;
  measurementDensity: number;
  imageBase64: string | null;
  routeError: string | null;
  cornerPoints: PixelPointApiResponse[];
  measurementPoints: PixelPointApiResponse[];
  populatedPath: PixelPointApiResponse[];
  // Full path with metadata from backend for job creation
  populatedPathWithMetadata: PathPopulatePointApiResponse[];
  batteries: BatteryCornersApiResponse[];
}

interface PreviewData {
  routePath: RoutePreviewCoordinate[];
  points: RoutePreviewPoint[];
  cornerPointIds: string[];
  draggablePointIds: string[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

interface PreviewBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function normalizeToUnit(
  point: PixelPointApiResponse,
  bounds: PreviewBounds,
): RoutePreviewCoordinate {
  const spanX = Math.max(bounds.maxX - bounds.minX, 1);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1);
  const x = (point.x - bounds.minX) / spanX;
  const y = (point.y - bounds.minY) / spanY;

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

function createMockDetectedPoints(): PixelPointApiResponse[] {
  return [
    { x: 90, y: 80 },
    { x: 250, y: 80 },
    { x: 410, y: 80 },
    { x: 410, y: 210 },
    { x: 250, y: 210 },
    { x: 90, y: 210 },
  ];
}

function createMockBatteries(): BatteryCornersApiResponse[] {
  return [{ corners: createMockDetectedPoints() }];
}

function getMeasurementDensityFromProfile(selectedProfile: ProfileModel | null): number {
  const options = selectedProfile?.settings.options;
  const densityOption =
    (options?.measurementDensity as number | undefined) ??
    (options?.pointsPerCm as number | undefined);

  if (typeof densityOption === 'number' && Number.isFinite(densityOption) && densityOption >= 0) {
    return densityOption;
  }

  return 0.5;
}

function detectItemsToBatteries(items: PathItemApiResponse[]): BatteryCornersApiResponse[] {
  return items
    .map((item) => {
      const corners = (item.corners ?? [])
        .map((corner) => {
          const x = (corner as { x?: number; pixelX?: number }).x ?? corner.pixelX;
          const y = (corner as { y?: number; pixelY?: number }).y ?? corner.pixelY;
          if (typeof x !== 'number' || typeof y !== 'number') {
            return null;
          }

          return { x, y };
        })
        .filter((corner): corner is PixelPointApiResponse => corner !== null);

      if (corners.length === 0) {
        return null;
      }

      return { corners };
    })
    .filter((battery): battery is BatteryCornersApiResponse => battery !== null);
}

function flattenBatteryCorners(batteries: BatteryCornersApiResponse[]): PixelPointApiResponse[] {
  return batteries.flatMap((battery) => battery.corners);
}

function createMockPopulatedPath(
  batteries: BatteryCornersApiResponse[],
  measuringPointsPerCm: number,
): PathPopulatePointApiResponse[] {
  const corners = flattenBatteryCorners(batteries);
  if (corners.length === 0) {
    return [];
  }

  const measurementCountPerSegment = Math.max(0, Math.round(measuringPointsPerCm * 2));
  const path: PathPopulatePointApiResponse[] = [];
  let globalIndex = 0;
  let measurementIndex = 0;

  for (let batteryNr = 0; batteryNr < corners.length; batteryNr += 1) {
    const current = corners[batteryNr];
    const next = corners[batteryNr + 1];

    // Add corner point
    path.push({
      index: `${globalIndex}`,
      batteryNr,
      cornerIndex: 0,
      measurementIndex,
      pixelX: current.x,
      pixelY: current.y,
    });
    globalIndex += 1;
    measurementIndex += 1;

    if (!next || measurementCountPerSegment === 0) {
      continue;
    }

    // Add measurement points between corners
    for (let step = 1; step <= measurementCountPerSegment; step += 1) {
      const ratio = step / (measurementCountPerSegment + 1);
      path.push({
        index: `${globalIndex}`,
        batteryNr,
        cornerIndex: 0,
        measurementIndex,
        pixelX: current.x + (next.x - current.x) * ratio,
        pixelY: current.y + (next.y - current.y) * ratio,
      });
      globalIndex += 1;
      measurementIndex += 1;
    }
  }

  return path;
}

function parsePopulatePath(response: {
  path?: PathPopulatePointApiResponse[];
}): PathPopulatePointApiResponse[] {
  // Backend returns path array with all metadata fields
  return response.path ?? [];
}

// Transform populated path points to simple pixel coordinates for preview
function populatedPathToPixels(points: PathPopulatePointApiResponse[]): PixelPointApiResponse[] {
  return points.map((p) => ({
    x: p.pixelX,
    y: p.pixelY,
  }));
}

// Transform populated path points to job path format with metadata
function populatedPathToJobPath(points: PathPopulatePointApiResponse[]): JobPathPointApiResponse[] {
  return points.map((p) => ({
    pixelX: p.pixelX,
    pixelY: p.pixelY,
    index: p.index,
    batteryNr: p.batteryNr,
    cornerIndex: p.cornerIndex,
    measurementIndex: p.measurementIndex,
  }));
}

export function useRoutePlan({ selectedProfile }: UseRoutePlanOptions) {
  const [state, setState] = useState<DetectState>({
    isInitializing: false,
    isPopulating: false,
    isCreatingJob: false,
    dryRun: false,
    measurementDensity: isMockModeEnabled()
      ? 0.5
      : getMeasurementDensityFromProfile(selectedProfile),
    imageBase64: null,
    routeError: null,
    cornerPoints: [],
    measurementPoints: [],
    populatedPath: [],
    populatedPathWithMetadata: [],
    batteries: [],
  });
  const populateRequestCounterRef = useRef(0);

  const runPopulate = useCallback(
    async (batteries: BatteryCornersApiResponse[], measurementDensity: number) => {
      if (batteries.length === 0) {
        setState((prev) => ({
          ...prev,
          isPopulating: false,
          cornerPoints: [],
          measurementPoints: [],
          populatedPath: [],
          populatedPathWithMetadata: [],
          batteries: [],
        }));
        return;
      }

      const requestId = populateRequestCounterRef.current + 1;
      populateRequestCounterRef.current = requestId;
      setState((prev) => ({ ...prev, isPopulating: true, routeError: null }));

      try {
        const populateResponse = isMockModeEnabled()
          ? {
              path: createMockPopulatedPath(batteries, measurementDensity),
            }
          : await populatePath({
              batteries,
              measuringPointsPerCm: measurementDensity,
              options: selectedProfile?.settings.options ?? {},
            });

        if (populateRequestCounterRef.current !== requestId) {
          return;
        }

        const populatedWithMetadata = parsePopulatePath(populateResponse);
        const populatedPixels = populatedPathToPixels(populatedWithMetadata);
        const currentCornerPoints = flattenBatteryCorners(batteries);
        const cornerSet = new Set(currentCornerPoints.map((point) => `${point.x}:${point.y}`));
        const separatedMeasurements = populatedPixels.filter(
          (point) => !cornerSet.has(`${point.x}:${point.y}`),
        );

        setState((prev) => ({
          ...prev,
          isPopulating: false,
          routeError: null,
          cornerPoints: currentCornerPoints,
          measurementPoints: separatedMeasurements,
          populatedPath: populatedPixels,
          populatedPathWithMetadata: populatedWithMetadata,
          batteries,
        }));
      } catch (error) {
        console.error('Path populate failed:', error);
        if (populateRequestCounterRef.current === requestId) {
          setState((prev) => ({
            ...prev,
            isPopulating: false,
            routeError: 'Failed to update route preview. Please retry.',
          }));
        }
      }
    },
    [selectedProfile],
  );

  const initializeRoute = useCallback(async () => {
    const defaultMeasurementDensity = isMockModeEnabled()
      ? 0.5
      : getMeasurementDensityFromProfile(selectedProfile);

    setState((prev) => ({
      ...prev,
      isInitializing: true,
      routeError: null,
      measurementDensity: defaultMeasurementDensity,
    }));

    try {
      const detectionResponse = isMockModeEnabled()
        ? {
            ok: true,
            detections: [],
            image_base64: null,
          }
        : await detectPath({ options: selectedProfile?.settings.options ?? {} });

      const detectedBatteries = isMockModeEnabled()
        ? createMockBatteries()
        : detectItemsToBatteries(detectionResponse.detections ?? []);

      if (detectedBatteries.length === 0) {
        throw new Error('No path points were detected.');
      }

      const detectedPoints = flattenBatteryCorners(detectedBatteries);

      setState((prev) => ({
        ...prev,
        isInitializing: false,
        cornerPoints: detectedPoints,
        measurementPoints: [],
        populatedPath: [],
        populatedPathWithMetadata: [],
        batteries: detectedBatteries,
        imageBase64: detectionResponse.image_base64 ?? null,
      }));

      await runPopulate(detectedBatteries, defaultMeasurementDensity);
    } catch (error) {
      console.error('Path detection failed:', error);
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        isPopulating: false,
        routeError: 'Failed to detect route points. Please retry.',
      }));
    }
  }, [runPopulate, selectedProfile]);

  useEffect(() => {
    if (!selectedProfile) {
      setState((prev) => ({
        ...prev,
        routeError: null,
        cornerPoints: [],
        measurementPoints: [],
        populatedPath: [],
        populatedPathWithMetadata: [],
        batteries: [],
        imageBase64: null,
      }));
      return;
    }

    void initializeRoute();
  }, [initializeRoute, selectedProfile]);

  const setMeasurementDensity = (value: number) => {
    setState((prev) => ({ ...prev, measurementDensity: value }));
    void runPopulate(state.batteries, value);
  };

  const moveCornerPoint = (pointId: string, x: number, y: number) => {
    const match = /^battery-(\d+)-corner-(\d+)$/.exec(pointId);
    if (!match) {
      return;
    }

    const batteryIndex = Number(match[1]);
    const cornerIndex = Number(match[2]);
    if (
      !Number.isInteger(batteryIndex) ||
      !Number.isInteger(cornerIndex) ||
      batteryIndex < 0 ||
      cornerIndex < 0 ||
      batteryIndex >= state.batteries.length ||
      cornerIndex >= state.batteries[batteryIndex].corners.length
    ) {
      return;
    }

    const updatedBatteries = state.batteries.map((battery, bIndex) => {
      if (bIndex !== batteryIndex) {
        return battery;
      }

      return {
        ...battery,
        corners: battery.corners.map((corner, cIndex) =>
          cIndex === cornerIndex ? { x, y } : corner,
        ),
      };
    });

    setState((prev) => ({
      ...prev,
      batteries: updatedBatteries,
      cornerPoints: flattenBatteryCorners(updatedBatteries),
    }));
    void runPopulate(updatedBatteries, state.measurementDensity);
  };

  const createScanJob = async (): Promise<string | null> => {
    // Use populated path with metadata if available, otherwise fall back to simple pixel points
    let jobPath: JobPathPointApiResponse[];

    if (state.populatedPathWithMetadata.length > 0) {
      // Backend provided metadata, use it
      jobPath = populatedPathToJobPath(state.populatedPathWithMetadata);
    } else if (state.populatedPath.length > 0) {
      // Fallback: convert pixel points to job path format without metadata
      jobPath = state.populatedPath.map((point, index) => ({
        pixelX: point.x,
        pixelY: point.y,
        index: `${index}`,
        batteryNr: undefined,
        cornerIndex: undefined,
        measurementIndex: undefined,
      }));
    } else if (state.cornerPoints.length > 0) {
      // Last resort: use corners only
      jobPath = state.cornerPoints.map((point, index) => ({
        pixelX: point.x,
        pixelY: point.y,
        index: `${index}`,
        batteryNr: undefined,
        cornerIndex: undefined,
        measurementIndex: undefined,
      }));
    } else {
      return null;
    }

    setState((prev) => ({ ...prev, isCreatingJob: true, routeError: null }));

    try {
      if (isMockModeEnabled()) {
        const mockJobId = `mock-job-${Date.now()}`;
        setState((prev) => ({ ...prev, isCreatingJob: false }));
        return mockJobId;
      }

      const response = await createJob({
        path: jobPath,
        workZ: selectedProfile?.settings.workZ ?? 0,
        workR: selectedProfile?.settings.workR ?? 0,
        dryRun: state.dryRun,
        options: {
          profile: selectedProfile?.name ?? 'default',
          ...(selectedProfile?.settings.options ?? {}),
        },
        imageBase64: state.imageBase64,
      });

      setState((prev) => ({ ...prev, isCreatingJob: false }));
      return response.id;
    } catch (error) {
      console.error('Job creation failed:', error);
      setState((prev) => ({
        ...prev,
        isCreatingJob: false,
        routeError: 'Failed to create job. Please retry.',
      }));
      return null;
    }
  };

  const preview = useMemo<PreviewData>(() => {
    const routePoints = state.populatedPath.length > 0 ? state.populatedPath : state.cornerPoints;
    const allPoints = [...state.cornerPoints, ...state.measurementPoints];

    if (routePoints.length === 0 && allPoints.length === 0) {
      return {
        routePath: [] as RoutePreviewCoordinate[],
        points: [] as RoutePreviewPoint[],
        cornerPointIds: [],
        draggablePointIds: [],
        bounds: {
          minX: 0,
          maxX: 1,
          minY: 0,
          maxY: 1,
        },
      };
    }

    const source = [...routePoints, ...allPoints];
    const bounds: PreviewBounds = {
      minX: Math.min(...source.map((point) => point.x)),
      maxX: Math.max(...source.map((point) => point.x)),
      minY: Math.min(...source.map((point) => point.y)),
      maxY: Math.max(...source.map((point) => point.y)),
    };

    const normalizedRoutePath = routePoints.map((point) => normalizeToUnit(point, bounds));
    const normalizedCorners = state.batteries.flatMap((battery, bIndex) =>
      battery.corners.map((point, cIndex) => ({
        id: `battery-${bIndex}-corner-${cIndex}`,
        label: `B${bIndex + 1}C${cIndex + 1}`,
        ...normalizeToUnit(point, bounds),
      })),
    );
    const normalizedMeasurements = state.measurementPoints.map((point, index) => ({
      id: `measurement-${index + 1}`,
      label: `M${index + 1}`,
      ...normalizeToUnit(point, bounds),
    }));
    const cornerPointIds = normalizedCorners.map((point) => point.id);

    return {
      routePath: normalizedRoutePath,
      points: [...normalizedCorners, ...normalizedMeasurements],
      cornerPointIds,
      draggablePointIds: cornerPointIds,
      bounds,
    };
  }, [state.batteries, state.cornerPoints, state.measurementPoints, state.populatedPath]);

  const resetRoutePlan = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      routeError: null,
      cornerPoints: [],
      measurementPoints: [],
      populatedPath: [],
      populatedPathWithMetadata: [],
      batteries: [],
    }));
    await initializeRoute();
  }, [initializeRoute]);

  return {
    state,
    preview,
    setDryRun: (value: boolean) => setState((prev) => ({ ...prev, dryRun: value })),
    setMeasurementDensity,
    moveCornerPoint,
    resetRoutePlan,
    createScanJob,
  };
}
