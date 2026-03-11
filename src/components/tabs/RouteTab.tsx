import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { RoutePreviewPanel } from './route/RoutePreviewPanel';
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
          <RoutePreviewPanel />
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
