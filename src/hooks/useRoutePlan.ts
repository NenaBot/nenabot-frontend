import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createJob,
  detectPath,
  PathItemApiResponse,
  PathPopulatePointApiResponse,
  populatePath,
  PixelPointApiResponse,
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
  detectItems: PathItemApiResponse[];
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

function detectItemsToPoints(items: PathItemApiResponse[]): PixelPointApiResponse[] {
  return items
    .map((item) => {
      if (typeof item.center_x !== 'number' || typeof item.center_y !== 'number') {
        return null;
      }

      return {
        x: item.center_x,
        y: item.center_y,
      };
    })
    .filter((item): item is PixelPointApiResponse => item !== null);
}

function createMockPopulatedPath(
  corners: PixelPointApiResponse[],
  measurementDensity: number,
): PathPopulatePointApiResponse[] {
  if (corners.length === 0) {
    return [];
  }

  const measurementCountPerSegment = Math.max(0, Math.round(measurementDensity * 2));
  const path: PathPopulatePointApiResponse[] = [];

  for (let index = 0; index < corners.length; index += 1) {
    const current = corners[index];
    const next = corners[index + 1];

    path.push({ ...current, type: 'corner', isCorner: true });

    if (!next || measurementCountPerSegment === 0) {
      continue;
    }

    for (let step = 1; step <= measurementCountPerSegment; step += 1) {
      const ratio = step / (measurementCountPerSegment + 1);
      path.push({
        x: current.x + (next.x - current.x) * ratio,
        y: current.y + (next.y - current.y) * ratio,
        type: 'measurement',
      });
    }
  }

  return path;
}

function parsePopulatePath(response: {
  waypoints?: PathPopulatePointApiResponse[];
  path?: PathPopulatePointApiResponse[];
  points?: PathPopulatePointApiResponse[];
}): PathPopulatePointApiResponse[] {
  return response.path ?? response.waypoints ?? response.points ?? [];
}

function splitCornersAndMeasurements(
  points: PathPopulatePointApiResponse[],
  corners: PixelPointApiResponse[],
): { corners: PixelPointApiResponse[]; measurements: PixelPointApiResponse[] } {
  const cornerSet = new Set(corners.map((point) => `${point.x}:${point.y}`));

  const mapped = points.map((point) => ({ x: point.x, y: point.y, meta: point }));
  const parsedCorners = mapped
    .filter((point) => point.meta.type === 'corner' || point.meta.isCorner)
    .map((point) => ({ x: point.x, y: point.y }));

  if (parsedCorners.length > 0) {
    return {
      corners: parsedCorners,
      measurements: mapped
        .filter((point) => !(point.meta.type === 'corner' || point.meta.isCorner))
        .map((point) => ({ x: point.x, y: point.y })),
    };
  }

  return {
    corners,
    measurements: mapped
      .filter((point) => !cornerSet.has(`${point.x}:${point.y}`))
      .map((point) => ({ x: point.x, y: point.y })),
  };
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
    detectItems: [],
  });
  const populateRequestCounterRef = useRef(0);

  const runPopulate = useCallback(
    async (
      cornerPoints: PixelPointApiResponse[],
      measurementDensity: number,
      detectItems: PathItemApiResponse[],
    ) => {
      if (cornerPoints.length === 0) {
        setState((prev) => ({
          ...prev,
          isPopulating: false,
          measurementPoints: [],
          populatedPath: [],
        }));
        return;
      }

      const requestId = populateRequestCounterRef.current + 1;
      populateRequestCounterRef.current = requestId;
      setState((prev) => ({ ...prev, isPopulating: true, routeError: null }));

      try {
        const populateResponse = isMockModeEnabled()
          ? {
              path: createMockPopulatedPath(cornerPoints, measurementDensity),
            }
          : await populatePath({
              corners: cornerPoints,
              measurementDensity,
              detections: detectItems,
              options: selectedProfile?.settings.options ?? {},
            });

        if (populateRequestCounterRef.current !== requestId) {
          return;
        }

        const populated = parsePopulatePath(populateResponse).map((point) => ({
          x: point.x,
          y: point.y,
          type: point.type,
          isCorner: point.isCorner,
        }));

        const pathPoints = populated.length > 0 ? populated : cornerPoints;
        const split = splitCornersAndMeasurements(pathPoints, cornerPoints);

        setState((prev) => ({
          ...prev,
          isPopulating: false,
          routeError: null,
          cornerPoints: split.corners,
          measurementPoints: split.measurements,
          populatedPath: pathPoints.map(({ x, y }) => ({ x, y })),
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

      const detectItems = detectionResponse.detections ?? [];
      const detectedPoints = isMockModeEnabled()
        ? createMockDetectedPoints()
        : detectItemsToPoints(detectItems);

      if (detectedPoints.length === 0) {
        throw new Error('No path points were detected.');
      }

      setState((prev) => ({
        ...prev,
        isInitializing: false,
        cornerPoints: detectedPoints,
        detectItems,
        imageBase64: detectionResponse.image_base64 ?? null,
      }));

      await runPopulate(detectedPoints, defaultMeasurementDensity, detectItems);
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
        imageBase64: null,
      }));
      return;
    }

    void initializeRoute();
  }, [initializeRoute, selectedProfile]);

  const setMeasurementDensity = (value: number) => {
    setState((prev) => ({ ...prev, measurementDensity: value }));
    void runPopulate(state.cornerPoints, value, state.detectItems);
  };

  const moveCornerPoint = (pointId: string, x: number, y: number) => {
    const cornerIndex = Number(pointId.replace('corner-', '')) - 1;
    if (
      !Number.isInteger(cornerIndex) ||
      cornerIndex < 0 ||
      cornerIndex >= state.cornerPoints.length
    ) {
      return;
    }

    const updatedCorners = state.cornerPoints.map((point, index) =>
      index === cornerIndex ? { x, y } : point,
    );

    setState((prev) => ({ ...prev, cornerPoints: updatedCorners }));
    void runPopulate(updatedCorners, state.measurementDensity, state.detectItems);
  };

  const createScanJob = async (): Promise<string | null> => {
    const path = state.populatedPath.length > 0 ? state.populatedPath : state.cornerPoints;

    if (path.length === 0) {
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
        path,
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
    const normalizedCorners = state.cornerPoints.map((point, index) => ({
      id: `corner-${index + 1}`,
      label: `C${index + 1}`,
      ...normalizeToUnit(point, bounds),
    }));
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
  }, [state.cornerPoints, state.measurementPoints, state.populatedPath]);

  return {
    state,
    preview,
    setDryRun: (value: boolean) => setState((prev) => ({ ...prev, dryRun: value })),
    setMeasurementDensity,
    moveCornerPoint,
    resetRoutePlan: initializeRoute,
    createScanJob,
  };
}
