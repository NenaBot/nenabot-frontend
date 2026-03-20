import { useMemo, useState } from 'react';
import {
  checkPath,
  createJob,
  detectPath,
  PathItemApiResponse,
  PixelPointApiResponse,
} from '../services/apiCalls';
import { ProfileModel } from '../types/profile.types';
import { isMockModeEnabled } from '../state/mockMode';
import { RoutePreviewCoordinate, RoutePreviewPoint } from '../types/routePreview.types';

interface UseRoutePlanOptions {
  selectedProfile: ProfileModel | null;
}

interface DetectState {
  isDetecting: boolean;
  isChecking: boolean;
  isCreatingJob: boolean;
  dryRun: boolean;
  imageBase64: string | null;
  detectError: string | null;
  checkedWaypoints: PixelPointApiResponse[];
  detectedPoints: PixelPointApiResponse[];
}

interface PreviewData {
  routePath: RoutePreviewCoordinate[];
  waypoints: RoutePreviewPoint[];
}

function normalizeToUnit(
  point: PixelPointApiResponse,
  maxX: number,
  maxY: number,
): RoutePreviewCoordinate {
  const x = maxX > 0 ? point.x / maxX : 0;
  const y = maxY > 0 ? point.y / maxY : 0;

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

export function useRoutePlan({ selectedProfile }: UseRoutePlanOptions) {
  const [state, setState] = useState<DetectState>({
    isDetecting: false,
    isChecking: false,
    isCreatingJob: false,
    dryRun: false,
    imageBase64: null,
    detectError: null,
    checkedWaypoints: [],
    detectedPoints: [],
  });

  const detectAndCheckPath = async () => {
    setState((prev) => ({ ...prev, isDetecting: true, detectError: null }));

    try {
      const detectionResponse = isMockModeEnabled()
        ? {
            ok: true,
            detections: [],
            image_base64: null,
          }
        : await detectPath({ options: selectedProfile?.settings.options ?? {} });

      const detectedPoints = isMockModeEnabled()
        ? createMockDetectedPoints()
        : detectItemsToPoints(detectionResponse.detections ?? []);

      if (detectedPoints.length === 0) {
        throw new Error('No path points were detected.');
      }

      setState((prev) => ({
        ...prev,
        isDetecting: false,
        isChecking: true,
        detectedPoints,
        imageBase64: detectionResponse.image_base64 ?? null,
      }));

      const checked = isMockModeEnabled()
        ? { waypoints: detectedPoints }
        : await checkPath(detectedPoints);

      setState((prev) => ({
        ...prev,
        isChecking: false,
        checkedWaypoints: checked.waypoints ?? detectedPoints,
      }));
    } catch (error) {
      console.error('Path detection/check failed:', error);
      setState((prev) => ({
        ...prev,
        isDetecting: false,
        isChecking: false,
        detectError: 'Failed to detect/check path. Please retry.',
      }));
    }
  };

  const createScanJob = async (): Promise<string | null> => {
    if (state.checkedWaypoints.length === 0) {
      return null;
    }

    setState((prev) => ({ ...prev, isCreatingJob: true, detectError: null }));

    try {
      if (isMockModeEnabled()) {
        const mockJobId = `mock-job-${Date.now()}`;
        setState((prev) => ({ ...prev, isCreatingJob: false }));
        return mockJobId;
      }

      const response = await createJob({
        path: state.checkedWaypoints,
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
        detectError: 'Failed to create job. Please retry.',
      }));
      return null;
    }
  };

  const preview = useMemo<PreviewData>(() => {
    const points =
      state.checkedWaypoints.length > 0 ? state.checkedWaypoints : state.detectedPoints;

    if (points.length === 0) {
      return {
        routePath: [] as RoutePreviewCoordinate[],
        waypoints: [] as RoutePreviewPoint[],
      };
    }

    const maxX = Math.max(...points.map((point) => point.x));
    const maxY = Math.max(...points.map((point) => point.y));

    const normalized = points.map((point) => normalizeToUnit(point, maxX, maxY));

    return {
      routePath: normalized,
      waypoints: normalized.map((point, index) => ({
        id: `wp-${index + 1}`,
        label: `W${index + 1}`,
        x: point.x,
        y: point.y,
      })),
    };
  }, [state.checkedWaypoints, state.detectedPoints]);

  return {
    state,
    preview,
    setDryRun: (value: boolean) => setState((prev) => ({ ...prev, dryRun: value })),
    detectAndCheckPath,
    createScanJob,
  };
}
