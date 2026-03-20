import { MapPin } from 'lucide-react';
import { CardSection } from '../../CardSection';
import { FormField } from '../../FormField';

interface RouteSettingsCardProps {
  measurementDensityInput: string;
  measurementDensityError: string | null;
  dryRun: boolean;
  isLoading: boolean;
  onDryRunChange: (value: boolean) => void;
  onMeasurementDensityInputChange: (value: string) => void;
}

export function RouteSettingsCard({
  measurementDensityInput,
  measurementDensityError,
  dryRun,
  isLoading,
  onDryRunChange,
  onMeasurementDensityInputChange,
}: RouteSettingsCardProps) {
  return (
    <CardSection
      title="Route Settings"
      headerContent={<MapPin className="w-5 h-5 text-[var(--md-sys-color-primary)]" />}
    >
      <FormField
        label="Measurement Density"
        tooltip="Defines how many additional measurement points are inserted between corner points."
      >
        <input
          type="number"
          value={measurementDensityInput}
          onChange={(event) => onMeasurementDensityInputChange(event.target.value)}
          className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
          min={0}
          max={100}
          step="0.1"
          disabled={isLoading}
          aria-invalid={measurementDensityError ? 'true' : 'false'}
        />
      </FormField>

      {measurementDensityError && (
        <p className="text-xs mt-2 text-[var(--md-sys-color-error)]">{measurementDensityError}</p>
      )}

      <label className="mt-5 flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(event) => onDryRunChange(event.target.checked)}
          className="w-4 h-4 accent-[var(--md-sys-color-primary)]"
          disabled={isLoading}
        />
        Dry Run
      </label>
    </CardSection>
  );
}
