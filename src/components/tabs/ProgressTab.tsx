import { useEffect } from 'react';
import { CameraView } from '../CameraView';
import { CurrentScanStatusCard } from './progress/CurrentScanStatusCard';
import { EventLogCard } from './progress/EventLogCard';
import { MeasurementLogCard } from './progress/MeasurementLogCard';
import { getScanProgressPercent, isTerminalScanState, ProgressTabState } from './progress/progress.model';

interface ProgressTabProps {
  onNext?: () => void;
}

export function ProgressTab({ onNext }: ProgressTabProps) {
  /**
   * Temporary mocked state for UI development.
   * Replace this object with API-backed state as soon as backend integration is available.
   */
  const progressState: ProgressTabState = {
    scan: {
      state: 'running',
      completedPoints: 847,
      totalPoints: 2500,
      elapsedSeconds: 4 * 60 + 12,
      estimatedRemainingSeconds: 8 * 60 + 15,
    },
    events: [
      { id: 1, time: '14:32:15', level: 'info', message: 'Scan started successfully' },
      { id: 2, time: '14:32:18', level: 'success', message: 'Spectrometer initialized' },
      { id: 3, time: '14:32:20', level: 'success', message: 'Calibration verified' },
      { id: 4, time: '14:32:25', level: 'info', message: 'Starting route navigation' },
      { id: 5, time: '14:32:30', level: 'info', message: 'Data collection in progress' },
    ],
    measurements: [
      { id: 1, point: 'A-001', wavelength: '450nm', intensity: 0.87, status: 'complete' },
      { id: 2, point: 'A-002', wavelength: '475nm', intensity: 0.92, status: 'complete' },
      { id: 3, point: 'A-003', wavelength: '500nm', intensity: 0.79, status: 'complete' },
      { id: 4, point: 'A-004', wavelength: '525nm', intensity: 0.85, status: 'processing' },
    ],
  };

  const scanProgress = getScanProgressPercent(progressState.scan);

  useEffect(() => {
    // Auto-advance to results when scan completes
    if (isTerminalScanState(progressState.scan.state) && scanProgress === 100 && onNext) {
      const timer = setTimeout(onNext, 1000); // 1s delay for visual feedback
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [progressState.scan.state, scanProgress, onNext]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Scan Progress</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Monitor live status, events, and recent measurements during the scan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Status and Controls */}
        <div className="lg:col-span-1 space-y-6">
          <CurrentScanStatusCard scan={progressState.scan} />
          <EventLogCard events={progressState.events} />
          <MeasurementLogCard measurements={progressState.measurements} />
        </div>

        {/* Right Panel - Live Camera Feed */}
        <div className="lg:col-span-2">
          <CameraView title="Live Camera Feed" showStatus={true} height="full" />
        </div>
      </div>
    </div>
  );
}