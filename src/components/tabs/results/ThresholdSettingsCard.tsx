interface ThresholdSettingsCardProps {
  threshold: number;
  criticalCount: number;
  totalCount: number;
  onThresholdChange: (value: number) => void;
}

export function ThresholdSettingsCard({
  threshold,
  criticalCount,
  totalCount,
  onThresholdChange,
}: ThresholdSettingsCardProps) {
  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)] block mb-1">
            Critical Threshold
          </label>
          <input
            type="number"
            value={threshold}
            min="0"
            max="2"
            step="0.01"
            onChange={(event) => onThresholdChange(Number(event.target.value))}
            className="w-20 px-2 py-1.5 border border-[var(--md-sys-color-outline)] rounded-md bg-[var(--md-sys-color-surface)] text-sm font-medium text-center"
          />
        </div>

        <div className="text-right">
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Critical Ratio</p>
          <p className="text-base font-semibold text-red-700 leading-tight whitespace-nowrap">
            {criticalCount} / {totalCount}
          </p>
        </div>
      </div>

      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
        Ratio shows how many measurement points exceed the threshold.
      </p>
    </div>
  );
}
