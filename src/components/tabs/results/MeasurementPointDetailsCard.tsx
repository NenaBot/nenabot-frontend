import { Activity } from 'lucide-react';
import {
  formatDateTime,
  formatMeasuredValue,
  isCriticalMeasurement,
  MeasurementPoint,
} from '../../../types/results.types';

interface MeasurementPointDetailsCardProps {
  point: MeasurementPoint | null;
  criticalThreshold: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function formatAxis(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return value.toFixed(3);
}

export function MeasurementPointDetailsCard({
  point,
  criticalThreshold,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: MeasurementPointDetailsCardProps) {
  if (!point) {
    return (
      <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)]">
        <h3 className="text-sm font-medium mb-2">Point Details</h3>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Select a measurement point from the preview or table.
        </p>
      </div>
    );
  }

  const isCritical = isCriticalMeasurement(point, criticalThreshold);

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)] space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
            Selected Point
          </p>
          <div className="flex items-center gap-2">
            <h3 className="text-lg">{point.label}</h3>
            {isCritical && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 border border-red-200">
                Critical
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="px-2.5 py-1.5 text-xs border border-[var(--md-sys-color-outline)] rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="px-2.5 py-1.5 text-xs border border-[var(--md-sys-color-outline)] rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-[var(--md-sys-color-on-surface-variant)]">Waypoint</dt>
          <dd>#{point.waypointIndex}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-[var(--md-sys-color-on-surface-variant)]">Position</dt>
          <dd className="font-mono text-xs">
            X: {formatAxis(point.x)} | Y: {formatAxis(point.y)} | Z: {formatAxis(null)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-[var(--md-sys-color-on-surface-variant)]">Measured</dt>
          <dd>{formatDateTime(point.timestamp)}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-2">
        <div className="rounded-lg border border-[var(--md-sys-color-outline-variant)] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)] text-sm">
            <Activity className="w-4 h-4" /> Measured Value
          </div>
          <div className={`font-medium ${isCritical ? 'text-red-700' : ''}`}>
            {formatMeasuredValue(point.measuredValue)}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--md-sys-color-outline-variant)] p-3">
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm mb-1">Comment</p>
          <div className="font-medium text-sm leading-5 max-h-20 overflow-auto">
            {point.comment || 'No comment'}
          </div>
        </div>
      </div>
    </div>
  );
}
