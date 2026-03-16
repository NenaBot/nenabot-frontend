import { useEffect, useMemo, useState } from 'react';
import { getDefaultRoutePlan } from '../services/routeApi';
import {
  createRouteTabInitialState,
  deriveEstimateFromBasis,
  getPointsPerCmValidationError,
  parsePointsPerCm,
} from '../types/route.types';

interface RoutePreviewCoordinate {
  x: number;
  y: number;
}

interface RoutePreviewPoint {
  id: string;
  label: string;
  x: number;
  y: number;
}

function createPreviewRoute(measurementPoints: number): {
  routePath: RoutePreviewCoordinate[];
  waypoints: RoutePreviewPoint[];
} {
  const columns = 8;
  const rows = Math.max(2, Math.ceil(Math.max(8, Math.min(64, measurementPoints)) / columns));
  const routePath: RoutePreviewCoordinate[] = [];
  const waypoints: RoutePreviewPoint[] = [];

  for (let row = 0; row < rows; row += 1) {
    const normalizedY = rows === 1 ? 0.5 : row / (rows - 1);
    const isEvenRow = row % 2 === 0;
    const rowStart = isEvenRow ? 0 : columns - 1;
    const rowEnd = isEvenRow ? columns : -1;
    const rowStep = isEvenRow ? 1 : -1;

    for (let column = rowStart; column !== rowEnd; column += rowStep) {
      const normalizedX = columns === 1 ? 0.5 : column / (columns - 1);
      routePath.push({ x: normalizedX, y: normalizedY });
    }

    const rowStartX = isEvenRow ? 0 : 1;
    const rowEndX = isEvenRow ? 1 : 0;
    waypoints.push({
      id: `wp-${row}-start`,
      label: `W${row * 2 + 1}`,
      x: rowStartX,
      y: normalizedY,
    });
    waypoints.push({ id: `wp-${row}-end`, label: `W${row * 2 + 2}`, x: rowEndX, y: normalizedY });
  }

  return { routePath, waypoints };
}

export function useRoutePlan() {
  const [routeState, setRouteState] = useState(createRouteTabInitialState);

  useEffect(() => {
    let isActive = true;

    const loadDefaultRoutePlan = async () => {
      setRouteState((prev) => ({
        ...prev,
        isLoadingDefaultPlan: true,
        loadError: null,
      }));

      try {
        const defaultPlan = await getDefaultRoutePlan();
        const validationError = getPointsPerCmValidationError(
          defaultPlan.settings.pointsPerCm.toString(),
        );

        if (!isActive) {
          return;
        }

        setRouteState((prev) => ({
          ...prev,
          isLoadingDefaultPlan: false,
          loadError: null,
          pointsPerCmInput: defaultPlan.settings.pointsPerCm.toString(),
          pointsPerCmError: validationError,
          plan: defaultPlan,
          estimateBasis: {
            pointsPerCm: defaultPlan.settings.pointsPerCm,
            estimate: defaultPlan.estimate,
          },
        }));
      } catch (error) {
        console.error('Failed to fetch default route plan:', error);

        if (!isActive) {
          return;
        }

        setRouteState((prev) => ({
          ...prev,
          isLoadingDefaultPlan: false,
          loadError: 'Failed to load default route from backend. Using fallback values.',
        }));
      }
    };

    void loadDefaultRoutePlan();

    return () => {
      isActive = false;
    };
  }, []);

  const handleAlwaysScanOnWaypointsChange = (checked: boolean) => {
    setRouteState((prev) => ({
      ...prev,
      plan: {
        ...prev.plan,
        settings: {
          ...prev.plan.settings,
          alwaysScanOnWaypoints: checked,
        },
      },
    }));
  };

  const handlePointsPerCmInputChange = (value: string) => {
    setRouteState((prev) => {
      const pointsPerCmError = getPointsPerCmValidationError(value);
      const parsedValue = parsePointsPerCm(value);

      if (parsedValue === null || pointsPerCmError !== null) {
        return {
          ...prev,
          pointsPerCmInput: value,
          pointsPerCmError,
        };
      }

      return {
        ...prev,
        pointsPerCmInput: value,
        pointsPerCmError: null,
        plan: {
          ...prev.plan,
          settings: {
            ...prev.plan.settings,
            pointsPerCm: parsedValue,
          },
          estimate: deriveEstimateFromBasis(parsedValue, prev.estimateBasis),
        },
      };
    });
  };

  const preview = useMemo(
    () => createPreviewRoute(routeState.plan.estimate.measurementPoints),
    [routeState.plan.estimate.measurementPoints],
  );

  return {
    routeState,
    isFormValid: routeState.pointsPerCmError === null,
    preview,
    handleAlwaysScanOnWaypointsChange,
    handlePointsPerCmInputChange,
  };
}
