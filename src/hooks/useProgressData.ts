import { useEffect, useMemo, useState } from 'react';
import { mockProgressTabState } from '../mocks/progressMocks';
import { ProgressEvent, ProgressTabState, ScanLifecycleState } from '../types/progress.types';
import { isMockModeEnabled } from '../state/mockMode';
import { useJobEvents } from './useJobEvents';

function toLifecycleState(state: string | undefined): ScanLifecycleState {
  if (state === 'completed' || state === 'failed' || state === 'stopped' || state === 'running') {
    return state;
  }

  return 'created';
}

function toEventLevel(type: string): ProgressEvent['level'] {
  if (type.includes('completed') || type.includes('started')) {
    return 'success';
  }

  if (type.includes('failed') || type.includes('stopped')) {
    return 'warning';
  }

  return 'info';
}

export function useProgressData(jobId: string | null) {
  const [progressState, setProgressState] = useState<ProgressTabState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { events: jobEvents, error: streamError } = useJobEvents(
    isMockModeEnabled() ? null : jobId,
  );

  useEffect(() => {
    if (isMockModeEnabled()) {
      setProgressState(mockProgressTabState);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!jobId) {
      setProgressState(null);
      setError('No active job selected.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [jobId]);

  const mappedState = useMemo<ProgressTabState | null>(() => {
    if (isMockModeEnabled()) {
      return mockProgressTabState;
    }

    if (!jobId) {
      return null;
    }

    if (jobEvents.length === 0) {
      return {
        scan: {
          state: 'created',
          completedPoints: 0,
          totalPoints: 0,
          elapsedSeconds: 0,
          estimatedRemainingSeconds: 0,
        },
        events: [],
        measurements: [],
      };
    }

    const lastEvent = jobEvents[jobEvents.length - 1];
    const totalPoints =
      typeof lastEvent.totalPoints === 'number' && Number.isFinite(lastEvent.totalPoints)
        ? Math.max(0, Math.round(lastEvent.totalPoints))
        : 0;
    const completedPoints =
      typeof lastEvent.lastPointProcessed === 'number' &&
      Number.isFinite(lastEvent.lastPointProcessed)
        ? Math.max(0, Math.round(lastEvent.lastPointProcessed))
        : 0;

    return {
      scan: {
        state: toLifecycleState(lastEvent.state),
        completedPoints,
        totalPoints,
        elapsedSeconds: 0,
        estimatedRemainingSeconds: Math.max(0, totalPoints - completedPoints),
      },
      events: jobEvents.map((event, index) => ({
        id: index + 1,
        time: event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '-',
        level: toEventLevel(event.type),
        message: event.type,
      })),
      measurements: jobEvents
        .filter((event) => Boolean(event.measurement))
        .map((event, index) => ({
          id: index + 1,
          point: `WP-${event.measurement?.waypointIndex ?? index + 1}`,
          wavelength: '-',
          intensity: 0,
          status: event.type.includes('completed') ? 'complete' : 'processing',
        })),
    };
  }, [jobEvents, jobId]);

  useEffect(() => {
    setProgressState(mappedState);
  }, [mappedState]);

  useEffect(() => {
    if (streamError) {
      setError(streamError);
      return;
    }

    if (jobId) {
      setError(null);
    }
  }, [jobId, streamError]);

  return {
    progressState,
    isLoading,
    error,
  };
}
