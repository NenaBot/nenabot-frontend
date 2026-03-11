import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import {
  RoutePreviewCoordinate,
  RoutePreviewPanel,
  RoutePreviewPoint,
} from './route/RoutePreviewPanel';
import { RouteSettingsCard } from './route/RouteSettingsCard';
import { getDefaultRoutePlan } from './route/route.api';
import {
  createRouteTabInitialState,
  deriveEstimateFromBasis,
  getPointsPerCmValidationError,
  parsePointsPerCm,
} from './route/route.model';

interface RouteTabProps {
  onNext?: () => void;
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

export function RouteTab({ onNext }: RouteTabProps) {
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

  const isFormValid = routeState.pointsPerCmError === null;
  const preview = createPreviewRoute(routeState.plan.estimate.measurementPoints);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Route Planning</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Define waypoint scanning settings and review the proposed route
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Route Settings */}
        <div className="lg:col-span-1 space-y-6">
          <RouteSettingsCard
            settings={routeState.plan.settings}
            estimate={routeState.plan.estimate}
            pointsPerCmInput={routeState.pointsPerCmInput}
            pointsPerCmError={routeState.pointsPerCmError}
            isLoading={routeState.isLoadingDefaultPlan}
            loadError={routeState.loadError}
            onAlwaysScanOnWaypointsChange={handleAlwaysScanOnWaypointsChange}
            onPointsPerCmInputChange={handlePointsPerCmInputChange}
          />
        </div>

        {/* Right Panel - Map Visualization */}
        <div className="lg:col-span-2">
          <RoutePreviewPanel
            title="Planned Scan Route"
            routePath={preview.routePath}
            measurementPoints={preview.waypoints}
            disablePointSelection={true}
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
        <button
          onClick={onNext}
          disabled={!isFormValid || routeState.isLoadingDefaultPlan}
          className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full flex items-center gap-2 hover:shadow-lg transition-all text-sm"
        >
          <Play className="w-4 h-4 fill-current" />
          Start Scan
        </button>
      </div>
    </div>
  );
}
