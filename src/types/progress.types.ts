/**
 * Scan lifecycle states used by the progress tab.
 *
 * - `running` is the active data collection phase.
 * - `paused` keeps partial progress and allows resume.
 * - `completed` and `aborted` are terminal states.
 */
export type ScanLifecycleState = 'created' | 'running' | 'completed' | 'failed' | 'stopped';

/**
 * Event severity controls iconography and emphasis in the event log.
 */
export type ProgressEventLevel = 'info' | 'success' | 'warning';

/**
 * A single event emitted during scan execution.
 */
export interface ProgressEvent {
  id: number;
  time: string;
  level: ProgressEventLevel;
  message: string;
}

/**
 * Measurement points are represented as a union to make processing states explicit.
 */
type MeasurementComplete = {
  id: number;
  point: string;
  intensity: number;
  timestamp: string;
  rawScanResult: Record<string, unknown> | null;
  status: 'complete';
};

type MeasurementProcessing = {
  id: number;
  point: string;
  intensity: number;
  timestamp: string;
  rawScanResult: Record<string, unknown> | null;
  status: 'processing';
};

export type ScanMeasurement = MeasurementComplete | MeasurementProcessing;

/**
 * Core scan status model used by the status card.
 */
export interface ScanStatusModel {
  state: ScanLifecycleState;
  completedPoints: number;
  totalPoints: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number;
}

/**
 * Root state for the progress tab.
 */
export interface ProgressTabState {
  scan: ScanStatusModel;
  events: ProgressEvent[];
  measurements: ScanMeasurement[];
  lastEventType: string | null;
}

/**
 * Returns integer progress in range [0, 100] from scan point counters.
 */
export function getScanProgressPercent(scan: ScanStatusModel): number {
  if (scan.totalPoints <= 0) {
    return 0;
  }

  const ratio = (scan.completedPoints / scan.totalPoints) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
}

/**
 * Human-readable label for scan lifecycle state.
 */
export function getScanStateLabel(state: ScanLifecycleState): string {
  switch (state) {
    case 'created':
      return 'Created';
    case 'running':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'stopped':
      return 'Stopped';
    default:
      return 'Unknown';
  }
}

/**
 * Utility formatter for durations shown in status widgets.
 */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

/**
 * Terminal states indicate no further scan progression is expected.
 */
export function isTerminalScanState(state: ScanLifecycleState): boolean {
  return state === 'completed' || state === 'failed' || state === 'stopped';
}
