import { useEffect, useState } from 'react';
import { CameraView } from '../CameraView';
import { CurrentScanStatusCard } from './progress/CurrentScanStatusCard';
import { EventLogCard } from './progress/EventLogCard';
import { MeasurementLogCard } from './progress/MeasurementLogCard';
import { getScanProgressPercent, isTerminalScanState } from '../../types/progress.types';
import { useProgressData } from '../../hooks/useProgressData';
import { deleteJob } from '../../services/apiCalls';
import { isMockModeEnabled } from '../../state/mockMode';

interface ProgressTabProps {
  jobId: string | null;
  onNext?: () => void;
}

export function ProgressTab({ jobId, onNext }: ProgressTabProps) {
  const { progressState, isLoading, error } = useProgressData(jobId);
  const [isAborting, setIsAborting] = useState(false);

  if (isLoading) {
    return <div className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading...</div>;
  }

  if (!progressState) {
    return (
      <div className="p-4 border border-[var(--md-sys-color-error)] rounded-lg text-sm text-[var(--md-sys-color-error)]">
        {error ?? 'Unable to load progress data.'}
      </div>
    );
  }

  const scanProgress = getScanProgressPercent(progressState.scan);

  const handleAbort = async () => {
    if (!jobId || isMockModeEnabled()) {
      return;
    }

    setIsAborting(true);
    try {
      await deleteJob(jobId);
    } catch (abortError) {
      console.error('Failed to abort job:', abortError);
    } finally {
      setIsAborting(false);
    }
  };

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
          <CurrentScanStatusCard
            scan={progressState.scan}
            onAbort={() => {
              void handleAbort();
            }}
            isAbortDisabled={!jobId || isAborting || isTerminalScanState(progressState.scan.state)}
          />
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
