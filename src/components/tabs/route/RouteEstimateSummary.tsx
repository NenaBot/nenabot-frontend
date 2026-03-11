import { formatEstimatedTime, formatMeasurementPoints, RouteEstimate } from './route.model';

interface RouteEstimateSummaryProps {
  estimate: RouteEstimate;
}

export function RouteEstimateSummary({ estimate }: RouteEstimateSummaryProps) {
  return (
    <div className="mt-6 p-3 bg-[var(--md-sys-color-secondary-container)] rounded-lg">
      <div className="text-xs text-[var(--md-sys-color-on-secondary-container)] space-y-1">
        <div className="flex justify-between">
          <span>Estimated Points:</span>
          <span className="font-medium">{formatMeasurementPoints(estimate.measurementPoints)}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Time:</span>
          <span className="font-medium">{formatEstimatedTime(estimate.estimatedSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
