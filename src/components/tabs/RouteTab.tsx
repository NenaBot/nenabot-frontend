import { Play } from 'lucide-react';
import { RoutePreviewPanel } from '../shared/RoutePreviewPanel';
import { RouteSettingsCard } from './route/RouteSettingsCard';
import { useRoutePlan } from '../../hooks/useRoutePlan';

interface RouteTabProps {
  onNext?: () => void;
}

export function RouteTab({ onNext }: RouteTabProps) {
  const {
    routeState,
    isFormValid,
    preview,
    handleAlwaysScanOnWaypointsChange,
    handlePointsPerCmInputChange,
  } = useRoutePlan();

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
