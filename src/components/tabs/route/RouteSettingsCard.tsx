import { MapPin } from 'lucide-react';
import { CardSection } from '../../CardSection';
import { FormField } from '../../FormField';
import { RouteEstimateSummary } from './RouteEstimateSummary';
import {
  POINTS_PER_CM_INPUT_MAX,
  POINTS_PER_CM_INPUT_MIN,
  RouteEstimate,
  RouteSettings,
} from './route.model';

interface RouteSettingsCardProps {
  settings: RouteSettings;
  estimate: RouteEstimate;
  pointsPerCmInput: string;
  pointsPerCmError: string | null;
  isLoading: boolean;
  loadError: string | null;
  onAlwaysScanOnWaypointsChange: (checked: boolean) => void;
  onPointsPerCmInputChange: (value: string) => void;
}

export function RouteSettingsCard({
  settings,
  estimate,
  pointsPerCmInput,
  pointsPerCmError,
  isLoading,
  loadError,
  onAlwaysScanOnWaypointsChange,
  onPointsPerCmInputChange,
}: RouteSettingsCardProps) {
  return (
    <CardSection
      title="Scan Parameters"
      headerContent={<MapPin className="w-5 h-5 text-[var(--md-sys-color-primary)]" />}
    >
      {loadError && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--md-sys-color-error-container)] text-xs text-[var(--md-sys-color-on-error-container)]">
          {loadError}
        </div>
      )}

      <div className="mb-5">
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
          <input
            type="checkbox"
            checked={settings.alwaysScanOnWaypoints}
            onChange={(e) => onAlwaysScanOnWaypointsChange(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-[var(--md-sys-color-outline)] accent-[var(--md-sys-color-primary)]"
            disabled={isLoading}
          />
          <div className="flex-1">
            <div className="text-sm mb-0.5">Always scan on waypoints</div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Collect measurements each time the robot reaches a waypoint.
            </div>
          </div>
        </label>
      </div>

      <FormField
        label="Points per cm"
        tooltip="Measurement density. Evenly creates new measurement points along the route. Set to 0 to scan only waypoints (no additional measurements). Higher values result in more detailed scans but take longer to complete."
      >
        <input
          type="number"
          value={pointsPerCmInput}
          onChange={(e) => onPointsPerCmInputChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
          min={POINTS_PER_CM_INPUT_MIN}
          max={POINTS_PER_CM_INPUT_MAX}
          step="0.1"
          disabled={isLoading}
          aria-invalid={pointsPerCmError ? 'true' : 'false'}
        />
      </FormField>

      {pointsPerCmError && (
        <p className="text-xs mt-2 text-[var(--md-sys-color-error)]">{pointsPerCmError}</p>
      )}

      <RouteEstimateSummary estimate={estimate} />
    </CardSection>
  );
}
