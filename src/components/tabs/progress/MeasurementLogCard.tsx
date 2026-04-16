import { CheckCircle } from 'lucide-react';
import { ScanMeasurement } from '../../../types/progress.types';

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
  return (
    <section className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <h3 className="text-sm font-medium">Recent Measurements</h3>
      </div>
      <div className="p-4 max-h-62.5 overflow-y-auto">
        <div className="space-y-2">
          {measurements.map((measurement) => (
            <div
              key={measurement.id}
              className="p-3 border border-[var(--md-sys-color-outline-variant)] rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{measurement.point}</span>
                {measurement.status === 'complete' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">λ: </span>
                  <span className="text-[var(--md-sys-color-on-surface)]">
                    {measurement.wavelength}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">
                    intensityTopAverage:{' '}
                  </span>
                  <span className="text-[var(--md-sys-color-on-surface)]">
                    {measurement.intensity.toFixed(3)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Timestamp: {measurement.timestamp}
              </p>
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-[var(--md-sys-color-primary)]">
                  Full scanResult payload
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-[var(--md-sys-color-surface)] p-2 text-[10px] leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  {formatRawPayload(measurement.rawScanResult)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
