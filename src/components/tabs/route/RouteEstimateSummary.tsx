import { Activity, Layers, MapPinned, Route, Timer } from 'lucide-react';
import {
  formatEstimatedTime,
  formatMeasurementPoints,
  RouteEstimate,
} from '../../../types/route.types';

interface RouteEstimateSummaryProps {
  estimate: RouteEstimate;
  profileName: string;
  workZ: number;
  workR: number;
  threshold: number;
  cornerPoints: number;
  measurementPoints: number;
  detectedBatteries: number;
  checkedWaypoints: number;
  statusMessage: string;
  isBusy: boolean;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
      <p className="text-[11px] uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
        {label}
      </p>
      <p className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">{value}</p>
    </div>
  );
}

export function RouteEstimateSummary({
  estimate,
  profileName,
  workZ,
  workR,
  threshold,
  cornerPoints,
  measurementPoints,
  detectedBatteries,
  checkedWaypoints,
  statusMessage,
  isBusy,
}: RouteEstimateSummaryProps) {
  return (
    <section className="mt-4 border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
          Route Overview
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] ${
            isBusy
              ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
              : 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
          }`}
        >
          <Activity className="w-3 h-3" />
          {isBusy ? 'Updating' : 'Ready'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
          <p className="text-[11px] uppercase tracking-wide">Estimated Points</p>
          <p className="text-2xl font-semibold leading-tight">
            {formatMeasurementPoints(estimate.measurementPoints)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
          <p className="text-[11px] uppercase tracking-wide">Estimated Time</p>
          <p className="text-2xl font-semibold leading-tight">
            {formatEstimatedTime(estimate.estimatedSeconds)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
          <MapPinned className="w-3 h-3" />
          Profile: {profileName}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
          Z: {workZ}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
          R: {workR}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
          Threshold: {threshold}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Corner Points" value={cornerPoints} />
        <StatTile label="Measurement Points" value={measurementPoints} />
        <StatTile label="Detected Batteries" value={detectedBatteries} />
        <StatTile label="Checked Waypoints" value={checkedWaypoints} />
      </div>

      <div className="flex items-start gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)] border-t border-[var(--md-sys-color-outline-variant)] pt-3">
        <Route className="w-3.5 h-3.5 mt-0.5" />
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>{statusMessage}</span>
        </div>
        <Timer className="w-3.5 h-3.5 ml-auto" />
      </div>
    </section>
  );
}
