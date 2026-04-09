import { Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RoutePreviewPanel } from '../shared/RoutePreviewPanel';
import { useRoutePlan } from '../../hooks/useRoutePlan';
import { ProfileModel } from '../../types/profile.types';
import { getMeasurementDensityValidationError } from '../../types/route.types';
import { RouteSettingsCard } from './route/RouteSettingsCard';

interface RouteTabProps {
  selectedProfile: ProfileModel | null;
  onJobCreated: (jobId: string) => void;
}

export function RouteTab({ selectedProfile, onJobCreated }: RouteTabProps) {
  const {
    state,
    preview,
    setDryRun,
    setMeasurementDensity,
    moveCornerPoint,
    resetRoutePlan,
    createScanJob,
  } = useRoutePlan({
    selectedProfile,
  });

  const imageUrl = state.imageBase64 ? `data:image/jpeg;base64,${state.imageBase64}` : null;
  const [measurementDensityInput, setMeasurementDensityInput] = useState(
    state.measurementDensity.toString(),
  );
  const [pendingMeasurementDensity, setPendingMeasurementDensity] = useState(
    state.measurementDensity,
  );
  const [measurementDensityError, setMeasurementDensityError] = useState<string | null>(null);
  const detectedBatteries = state.batteries.length;
  const checkedWaypoints = state.cornerPoints.length > 0 ? state.measurementPoints.length : 0;
  const isRouteReady =
    state.cornerPoints.length > 0 &&
    preview.routePath.length > 0 &&
    !state.isInitializing &&
    !state.isPopulating;
  const isStartDisabled = !isRouteReady || state.isCreatingJob || !selectedProfile;

  useEffect(() => {
    setMeasurementDensityInput(state.measurementDensity.toString());
    setPendingMeasurementDensity(state.measurementDensity);
  }, [state.measurementDensity]);

  useEffect(() => {
    if (measurementDensityError) {
      return;
    }

    if (pendingMeasurementDensity === state.measurementDensity) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMeasurementDensity(pendingMeasurementDensity);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    measurementDensityError,
    pendingMeasurementDensity,
    setMeasurementDensity,
    state.measurementDensity,
  ]);

  const handleMeasurementDensityChange = (nextValue: string) => {
    setMeasurementDensityInput(nextValue);

    const validationError = getMeasurementDensityValidationError(nextValue);
    if (validationError) {
      setMeasurementDensityError(validationError);
      return;
    }

    setMeasurementDensityError(null);
    setPendingMeasurementDensity(Number(nextValue));
  };

  const handleCornerPointDragEnd = (pointId: string, normalizedX: number, normalizedY: number) => {
    const spanX = Math.max(preview.bounds.maxX - preview.bounds.minX, 1);
    const spanY = Math.max(preview.bounds.maxY - preview.bounds.minY, 1);

    moveCornerPoint(
      pointId,
      preview.bounds.minX + normalizedX * spanX,
      preview.bounds.minY + normalizedY * spanY,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl mb-1">Route Planning</h2>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Adjust detected corner points and measurement density before starting a new scan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void resetRoutePlan();
          }}
          disabled={state.isInitializing || state.isPopulating || !selectedProfile}
          className="px-3 py-2 rounded-lg border border-[var(--md-sys-color-outline)] text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-2 disabled:opacity-60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {!selectedProfile && (
        <div className="p-3 border border-[var(--md-sys-color-error)] rounded-lg text-sm text-[var(--md-sys-color-error)]">
          Select a profile in Setup before creating a route.
        </div>
      )}

      {state.routeError && (
        <div className="p-3 border border-[var(--md-sys-color-error)] rounded-lg text-sm text-[var(--md-sys-color-error)]">
          {state.routeError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RouteSettingsCard
            measurementDensityInput={measurementDensityInput}
            measurementDensityError={measurementDensityError}
            dryRun={state.dryRun}
            isLoading={state.isInitializing || state.isPopulating}
            onDryRunChange={setDryRun}
            onMeasurementDensityInputChange={handleMeasurementDensityChange}
          />

          <div className="mt-4 text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-1">
            <p>Profile: {selectedProfile?.name ?? '-'}</p>
            <p>Work Z: {selectedProfile?.settings.workZ ?? 0}</p>
            <p>Work R: {selectedProfile?.settings.workR ?? 0}</p>
            <p>Corner points: {state.cornerPoints.length}</p>
            <p>Measurement points: {state.measurementPoints.length}</p>
            <p>
              {state.isInitializing
                ? 'Detecting initial path...'
                : state.isPopulating
                  ? 'Updating populated path...'
                  : 'Route preview up to date.'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <RoutePreviewPanel
            title="Detected Route Preview"
            imageUrl={imageUrl}
            routePath={preview.routePath}
            measurementPoints={preview.points}
            cornerPointIds={preview.cornerPointIds}
            draggablePointIds={preview.draggablePointIds}
            disablePointSelection={true}
            enablePointDragging={true}
            onPointDragEnd={handleCornerPointDragEnd}
          />
          <div className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)] inline-block" />
              Corner points (draggable)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-secondary)] inline-block" />
              Measurement points
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-lg px-3 py-2">
        <span>Detected batteries: {detectedBatteries}</span>
        <span>Checked waypoints: {checkedWaypoints}</span>
      </div>

      <button
        type="button"
        disabled={isStartDisabled}
        onClick={() => {
          void createScanJob().then((jobId) => {
            if (jobId) {
              onJobCreated(jobId);
            }
          });
        }}
        className="w-full px-4 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Play className="w-4 h-4 fill-current" />
        {state.isCreatingJob ? 'Creating Job...' : 'Start Scan Job'}
      </button>
    </div>
  );
}
