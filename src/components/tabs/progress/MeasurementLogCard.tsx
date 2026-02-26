import { CheckCircle } from 'lucide-react';
import { ScanMeasurement } from './progress.model';

interface MeasurementLogCardProps {
  measurements: ScanMeasurement[];
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
                  <span className="text-[var(--md-sys-color-on-surface)]">{measurement.wavelength}</span>
                </div>
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">I: </span>
                  <span className="text-[var(--md-sys-color-on-surface)]">{measurement.intensity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
