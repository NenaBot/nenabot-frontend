import { useEffect, useMemo, useState } from 'react';
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
  const scanProgress = useMemo(() => {
    if (!progressState) {
      return 0;
    }

    return getScanProgressPercent(progressState.scan);
  }, [progressState]);
  const isTerminal = progressState ? isTerminalScanState(progressState.scan.state) : false;

  const handleAbort = async () => {
    if (
      !jobId ||
      isMockModeEnabled() ||
      !progressState ||
      isTerminalScanState(progressState.scan.state)
    ) {
      console.log(
        `[ProgressTab] Abort cancelled: jobId=${jobId}, mockMode=${isMockModeEnabled()}, terminalState=${progressState ? isTerminalScanState(progressState.scan.state) : 'no progress state'}`,
      );
      return;
    }

    console.log(`[ProgressTab] Aborting job ${jobId}`);
    setIsAborting(true);
    try {
      await deleteJob(jobId);
      console.log(`[ProgressTab] Job ${jobId} aborted successfully`);
    } catch (abortError) {
      console.error(`[ProgressTab] Failed to abort job ${jobId}:`, abortError);
    } finally {
      setIsAborting(false);
    }
  };

  useEffect(() => {
    if (!progressState || !onNext) {
      return undefined;
    }

    // Auto-advance to results when scan completes
    if (isTerminalScanState(progressState.scan.state) && scanProgress === 100 && onNext) {
      console.log(
        `[ProgressTab] Scan completed (${scanProgress}%), auto-advancing to results in 1s`,
      );
      const timer = setTimeout(onNext, 1000); // 1s delay for visual feedback
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [progressState, scanProgress, onNext]);

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

          {isTerminal && (
            <div className="mt-4 p-4 border border-[var(--md-sys-color-outline-variant)] rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                {onNext
                  ? 'Scan reached a terminal state. Use this action if auto-navigation does not trigger.'
                  : 'Scan reached a terminal state. Auto-navigation is unavailable; open the Results tab from the top navigation.'}
              </p>
              <button
                type="button"
                className="mt-3 px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-sm hover:shadow-md transition-all"
                disabled={!onNext}
                onClick={() => {
                  onNext?.();
                }}
              >
                Go to Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
