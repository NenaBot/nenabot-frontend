import { useEffect, useMemo, useState } from 'react';
import { mockJobEvents } from '../mocks/progressMocks';
import { fetchJobs, JobEventApiResponse } from '../services/apiCalls';
import { ProgressEvent, ProgressTabState, ScanLifecycleState } from '../types/progress.types';
import { useJobEvents } from './useJobEvents';
import { useMockMode } from './useMockMode';

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

function normalizeEventType(type: unknown): string {
  return typeof type === 'string' ? type : 'unknown';
}

function normalizeEventTime(timestamp: unknown): string {
  if (typeof timestamp !== 'string' || timestamp.trim().length === 0) {
    return '-';
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleTimeString();
}

function toMeasurementIntensity(event: JobEventApiResponse): number {
  const scanResult = event.measurement?.scanResult;
  if (!scanResult || typeof scanResult !== 'object') {
    return 0;
  }

  const intensityCandidate =
    (scanResult as { measuredValue?: unknown }).measuredValue ??
    (scanResult as { value?: unknown }).value ??
    (scanResult as { intensity?: unknown }).intensity;

  return typeof intensityCandidate === 'number' && Number.isFinite(intensityCandidate)
    ? intensityCandidate
    : 0;
}

function mapEventsToProgressState(events: JobEventApiResponse[]): ProgressTabState {
  if (events.length === 0) {
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
      lastEventType: null,
    };
  }

  const lastEvent = events[events.length - 1];
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
    events: events.map((event, index) => ({
      id: index + 1,
      time: normalizeEventTime(event.timestamp),
      level: toEventLevel(normalizeEventType(event.type)),
      message: normalizeEventType(event.type),
    })),
    measurements: events
      .filter((event) => Boolean(event.measurement))
      .map((event, index) => ({
        id: index + 1,
        point: `WP-${event.measurement?.waypointIndex ?? index + 1}`,
        time: normalizeEventTime(event.measurement?.timestamp ?? event.timestamp),
        intensity: toMeasurementIntensity(event),
        status: normalizeEventType(event.type).includes('completed') ? 'complete' : 'processing',
      })),
    lastEventType: normalizeEventType(lastEvent.type),
  };
}

export function useProgressData(jobId: string | null, isActive = true) {
  const [mockMode] = useMockMode();
  const [recoveredJobId, setRecoveredJobId] = useState<string | null>(null);
  const [isResolvingJob, setIsResolvingJob] = useState(false);
  const [progressState, setProgressState] = useState<ProgressTabState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeJobId = jobId ?? recoveredJobId;
  const { events: jobEvents, error: streamError } = useJobEvents(
    mockMode ? null : activeJobId,
    isActive,
  );
  const hasEvents = jobEvents.length > 0;

  useEffect(() => {
    if (mockMode || !isActive) {
      return;
    }

    if (jobId && jobId.trim().length > 0) {
      setRecoveredJobId(null);
      return;
    }

    let isCancelled = false;

    const recoverPreferredJob = async () => {
      setIsResolvingJob(true);
      try {
        const jobs = await fetchJobs();
        const runningJobs = jobs.filter((job) => job.status?.state === 'running');
        const completedJobs = jobs.filter((job) => job.status?.state === 'completed');
        const newestRunningJob = runningJobs[runningJobs.length - 1] ?? null;
        const newestCompletedJob = completedJobs[completedJobs.length - 1] ?? null;
        const preferredJob = newestRunningJob ?? newestCompletedJob;

        if (!isCancelled) {
          setRecoveredJobId(preferredJob?.id ?? null);
        }
      } catch (recoveryError) {
        console.warn('[ProgressData] Failed to recover job:', recoveryError);
        if (!isCancelled) {
          setRecoveredJobId(null);
        }
      } finally {
        if (!isCancelled) {
          setIsResolvingJob(false);
        }
      }
    };

    void recoverPreferredJob();

    return () => {
      isCancelled = true;
    };
  }, [isActive, jobId, mockMode]);

  useEffect(() => {
    if (mockMode) {
      setProgressState(mapEventsToProgressState(mockJobEvents));
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(null);

    if (!activeJobId) {
      if (isResolvingJob) {
        setProgressState(null);
        setIsLoading(true);
        return;
      }

      setProgressState(null);
      setError('No active job selected.');
      setIsLoading(false);
      return;
    }

    if (!hasEvents && !streamError) {
      setProgressState(null);
      setIsLoading(true);
      return;
    }

    setIsLoading(false);
  }, [activeJobId, hasEvents, isResolvingJob, mockMode, streamError]);

  const mappedState = useMemo<ProgressTabState | null>(() => {
    if (mockMode) {
      return mapEventsToProgressState(mockJobEvents);
    }

    if (!activeJobId) {
      return null;
    }

    if (!hasEvents && !streamError) {
      return null;
    }

    return mapEventsToProgressState(jobEvents);
  }, [activeJobId, hasEvents, jobEvents, mockMode, streamError]);

  useEffect(() => {
    setProgressState(mappedState);
  }, [mappedState]);

  useEffect(() => {
    if (streamError) {
      setError(streamError);
      setIsLoading(false);
      return;
    }

    if (activeJobId) {
      setError(null);
    }
  }, [activeJobId, streamError]);

  return {
    activeJobId,
    progressState,
    isLoading,
    error,
  };
}
