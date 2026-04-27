import { CheckCircle } from 'lucide-react';
import { useTopInsertListAnimation } from '../../../hooks/useTopInsertListAnimation';
import { ScanMeasurement } from '../../../types/progress.types';
import { ProgressLogCard } from './ProgressLogCard';

interface MeasurementLogCardProps {
  measurements: ScanMeasurement[];
}

function formatRawPayload(payload: Record<string, unknown> | null): string {
  if (!payload) {
    return '{}';
  }

  return JSON.stringify(payload, null, 2);
}

/**
 * Shows latest measurements with explicit processing/complete state markers.
 */
export function MeasurementLogCard({ measurements }: MeasurementLogCardProps) {
  const {
    displayItems: displayMeasurements,
    enteringItemId,
    isPushingExistingItems,
  } = useTopInsertListAnimation(measurements);

  const formatIntensity = (value: number): string => {
    if (!Number.isFinite(value)) {
      return '-';
    }

    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(value);
  };

  return (
    <ProgressLogCard
      title="Recent Measurements"
      isEmpty={displayMeasurements.length === 0}
      emptyMessage="Waiting for measurements..."
    >
      <div className="space-y-2">
        {displayMeasurements.map((measurement) => {
          const enterClass = enteringItemId === measurement.id ? 'progress-log-item-enter' : '';
          const pushClass =
            isPushingExistingItems && enteringItemId !== measurement.id
              ? 'progress-log-item-push'
              : '';

          return (
            <div
              key={measurement.id}
              data-testid={`measurement-log-row-${measurement.id}`}
              className={`p-3 border border-(--md-sys-color-outline-variant) rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-colors ${enterClass} ${pushClass}`.trim()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{measurement.point}</span>
                {measurement.status === 'complete' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-(--md-sys-color-on-surface-variant)">Intensity: </span>
                  <span className="text-(--md-sys-color-on-surface)">
                    {formatIntensity(measurement.intensity)}
                  </span>
                </div>
                <div>
                  <span className="text-(--md-sys-color-on-surface-variant)">Timestamp: </span>
                  <span className="text-(--md-sys-color-on-surface)">{measurement.timestamp}</span>
                </div>
              </div>
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-[var(--md-sys-color-primary)]">
                  Full scanResult payload
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-[var(--md-sys-color-surface)] p-2 text-[10px] leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  {formatRawPayload(measurement.rawScanResult)}
                </pre>
              </details>
            </div>
          );
        })}
      </div>
    </ProgressLogCard>
  );
}
