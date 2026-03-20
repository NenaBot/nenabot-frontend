import { Map, Play, Radar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoutePreviewPanel } from '../shared/RoutePreviewPanel';
import { useRoutePlan } from '../../hooks/useRoutePlan';
import { ProfileModel } from '../../types/profile.types';

interface RouteTabProps {
  selectedProfile: ProfileModel | null;
  onJobCreated: (jobId: string) => void;
}

// Default mock waypoints and route path displayed when no detection has been performed
interface DefaultPreviewData {
  waypoints: Array<{ id: string; label: string; x: number; y: number }>;
  routePath: Array<{ x: number; y: number }>;
}

function createDefaultMockPreview(): DefaultPreviewData {
  const waypoints = [
    { id: 'wp-1', label: '1', x: 0.15, y: 0.2 },
    { id: 'wp-2', label: '2', x: 0.5, y: 0.2 },
    { id: 'wp-3', label: '3', x: 0.85, y: 0.2 },
    { id: 'wp-4', label: '4', x: 0.85, y: 0.5 },
    { id: 'wp-5', label: '5', x: 0.5, y: 0.5 },
    { id: 'wp-6', label: '6', x: 0.15, y: 0.5 },
    { id: 'wp-7', label: '7', x: 0.15, y: 0.8 },
    { id: 'wp-8', label: '8', x: 0.5, y: 0.8 },
    { id: 'wp-9', label: '9', x: 0.85, y: 0.8 },
  ];

  // Create a serpentine path connecting all waypoints
  const routePath = [
    { x: 0.15, y: 0.2 },
    { x: 0.5, y: 0.2 },
    { x: 0.85, y: 0.2 },
    { x: 0.85, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.15, y: 0.5 },
    { x: 0.15, y: 0.8 },
    { x: 0.5, y: 0.8 },
    { x: 0.85, y: 0.8 },
  ];

  return { waypoints, routePath };
}

export function RouteTab({ selectedProfile, onJobCreated }: RouteTabProps) {
  const { state, preview, setDryRun, detectAndCheckPath, createScanJob } = useRoutePlan({
    selectedProfile,
  });

  const imageUrl = state.imageBase64 ? `data:image/jpeg;base64,${state.imageBase64}` : null;

  // Display default mock data when no detection has been performed yet
  const defaultPreview = useMemo(() => createDefaultMockPreview(), []);
  const [draggableWaypoints, setDraggableWaypoints] = useState(defaultPreview.waypoints);
  const displayRoutePath =
    preview.routePath.length > 0 ? preview.routePath : defaultPreview.routePath;
  const displayWaypoints = preview.waypoints.length > 0 ? preview.waypoints : draggableWaypoints;

  const handleWaypointDragEnd = (pointId: string, newX: number, newY: number) => {
    setDraggableWaypoints((prev) =>
      prev.map((wp) => (wp.id === pointId ? { ...wp, x: newX, y: newY } : wp)),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Route Planning</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Detect and validate route points before creating a new job.
        </p>
      </div>

      {!selectedProfile && (
        <div className="p-3 border border-[var(--md-sys-color-error)] rounded-lg text-sm text-[var(--md-sys-color-error)]">
          Select a profile in Setup before creating a route.
        </div>
      )}

      {state.detectError && (
        <div className="p-3 border border-[var(--md-sys-color-error)] rounded-lg text-sm text-[var(--md-sys-color-error)]">
          {state.detectError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 bg-[var(--md-sys-color-surface-container-lowest)]">
          <h3 className="text-lg">Detection Actions</h3>

          <button
            type="button"
            onClick={() => {
              void detectAndCheckPath();
            }}
            disabled={state.isDetecting || state.isChecking || !selectedProfile}
            className="w-full px-4 py-3 rounded-lg border border-[var(--md-sys-color-outline)] text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Radar className="w-4 h-4" />
            {state.isDetecting
              ? 'Detecting...'
              : state.isChecking
                ? 'Checking Path...'
                : 'Detect and Check Path'}
          </button>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={state.dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
              className="w-4 h-4 accent-[var(--md-sys-color-primary)]"
            />
            Dry Run
          </label>

          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-1">
            <p>Profile: {selectedProfile?.name ?? '-'}</p>
            <p>Work Z: {selectedProfile?.settings.workZ ?? 0}</p>
            <p>Work R: {selectedProfile?.settings.workR ?? 0}</p>
            <p>Detected points: {state.detectedPoints.length}</p>
            <p>Checked waypoints: {state.checkedWaypoints.length}</p>
          </div>

          <button
            type="button"
            disabled={
              state.checkedWaypoints.length === 0 || state.isCreatingJob || !selectedProfile
            }
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

        <div className="lg:col-span-2">
          <RoutePreviewPanel
            title="Detected Static Image + Path Overlay"
            imageUrl={imageUrl}
            routePath={displayRoutePath}
            measurementPoints={displayWaypoints}
            disablePointSelection={true}
            enablePointDragging={true}
            onPointDragEnd={handleWaypointDragEnd}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] border-t border-[var(--md-sys-color-outline-variant)] pt-3">
        <span className="flex items-center gap-2">
          <Map className="w-4 h-4" />
          RouteTab uses static image preview only (no stream).
        </span>
      </div>
    </div>
  );
}
