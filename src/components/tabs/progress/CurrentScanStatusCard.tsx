import { Clock, Pause, Square } from 'lucide-react';
import {
  formatDuration,
  getScanProgressPercent,
  getScanStateLabel,
  ScanStatusModel,
} from './progress.model';

interface CurrentScanStatusCardProps {
  scan: ScanStatusModel;
}

/**
 * Main scan status card:
 * - shows lifecycle status
 * - shows points and progress bar
 * - keeps controls close to live status data
 */
export function CurrentScanStatusCard({ scan }: CurrentScanStatusCardProps) {
  const progress = getScanProgressPercent(scan);
  const stateLabel = getScanStateLabel(scan.state);

  return (
    <section className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg">Scan Status</h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>{stateLabel}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Progress</span>
          <span className="text-[var(--md-sys-color-on-surface)] font-medium">
            {scan.completedPoints} / {scan.totalPoints} points
          </span>
        </div>
        <div className="w-full h-2 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{progress}% complete</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg">
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">Elapsed</div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{formatDuration(scan.elapsedSeconds)}</span>
          </div>
        </div>
        <div className="p-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg">
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">Remaining</div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">~{formatDuration(scan.estimatedRemainingSeconds)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--md-sys-color-surface-variant)] transition-all text-sm">
          <Pause className="w-4 h-4" />
          Pause
        </button>
        <button className="flex-1 px-4 py-2.5 bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all text-sm">
          <Square className="w-4 h-4 fill-current" />
          Abort
        </button>
      </div>
    </section>
  );
}
