import { MapPin } from 'lucide-react';
import { CardSection } from '../../CardSection';
import { FormField } from '../../FormField';
import { MEASUREMENT_DENSITY_MAX, MEASUREMENT_DENSITY_MIN } from '../../../types/route.types';

interface RouteSettingsCardProps {
  measurementDensityInput: string;
  measurementDensityError: string | null;
  dryRun: boolean;
  isLoading: boolean;
  isPopulateDisabled: boolean;
  onDryRunChange: (value: boolean) => void;
  onMeasurementDensityInputChange: (value: string) => void;
  onPopulatePath: () => void;
}

export function RouteSettingsCard({
  measurementDensityInput,
  measurementDensityError,
  dryRun,
  isLoading,
  isPopulateDisabled,
  onDryRunChange,
  onMeasurementDensityInputChange,
  onPopulatePath,
}: RouteSettingsCardProps) {
  return (
    <CardSection
      title="Route Settings"
      headerContent={<MapPin className="w-5 h-5 text-(--md-sys-color-primary)" />}
    >
      <FormField
        label="Measurement Density"
        tooltip={`Defines how many additional measurement points are inserted between corner points. Use ${MEASUREMENT_DENSITY_MIN} for corners only, up to ${MEASUREMENT_DENSITY_MAX} for the maximum density.`}
      >
        <input
          type="number"
          aria-label="Measurement Density"
          value={measurementDensityInput}
          onChange={(event) => onMeasurementDensityInputChange(event.target.value)}
          className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
          min={MEASUREMENT_DENSITY_MIN}
          max={MEASUREMENT_DENSITY_MAX}
          step="0.1"
          disabled={isLoading}
          aria-invalid={measurementDensityError ? 'true' : 'false'}
        />
      </FormField>

      {measurementDensityError && (
        <p className="text-xs mt-2 text-(--md-sys-color-error)">{measurementDensityError}</p>
      )}

      <label className="mt-5 flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(event) => onDryRunChange(event.target.checked)}
          className="w-4 h-4 accent-(--md-sys-color-primary)"
          disabled={isLoading}
        />
        Dry Run
      </label>

      <button
        type="button"
        onClick={onPopulatePath}
        disabled={isPopulateDisabled}
        className="mt-5 w-full px-3 py-2.5 rounded-lg bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) text-sm font-medium disabled:opacity-60"
      >
        Populate Path
      </button>
    </CardSection>
  );
}
