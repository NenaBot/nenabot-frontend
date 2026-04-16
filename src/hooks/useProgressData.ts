import { useEffect, useMemo, useState } from 'react';
import { mockJobEvents } from '../mocks/progressMocks';
import { fetchJobs, JobEventApiResponse } from '../services/apiCalls';
import { ProgressEvent, ProgressTabState, ScanLifecycleState } from '../types/progress.types';
import {
  estimateRouteDurationSeconds,
  ROUTE_ESTIMATE_SECONDS_PER_POINT,
  ROUTE_ESTIMATE_STARTUP_SECONDS,
} from '../types/route.types';
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

function parseTimestampMs(timestamp: unknown): number | null {
  if (typeof timestamp !== 'string' || timestamp.trim().length === 0) {
    return null;
  }

  const parsed = new Date(timestamp);
  const ms = parsed.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function normalizeEventTime(timestamp: unknown): string {
  const parsedMs = parseTimestampMs(timestamp);
  if (parsedMs === null) {
    return '-';
  }

  return new Date(parsedMs).toLocaleTimeString();
}

function averageTopIntensities(values: unknown): number | null {
  if (!Array.isArray(values)) {
    return null;
  }

  const numericValues = values
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .sort((a, b) => b - a)
    .slice(0, 3);

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function toMeasurementIntensity(event: JobEventApiResponse): number {
  const scanResult = event.measurement?.scanResult;
  if (!scanResult || typeof scanResult !== 'object') {
    return 0;
  }

  const evaluation = (scanResult as { evaluation?: unknown }).evaluation;
  if (evaluation && typeof evaluation === 'object') {
    const intensityCandidate = (evaluation as { intensityTopAverage?: unknown })
      .intensityTopAverage;

    if (typeof intensityCandidate === 'number' && Number.isFinite(intensityCandidate)) {
      return intensityCandidate;
    }

    const intensityAverage = (evaluation as { intensity_average?: unknown }).intensity_average;
    if (typeof intensityAverage === 'number' && Number.isFinite(intensityAverage)) {
      return intensityAverage;
    }

    const evaluationTopAverage = averageTopIntensities(
      (evaluation as { intensityTop?: unknown }).intensityTop,
    );
    if (evaluationTopAverage !== null) {
      return evaluationTopAverage;
    }
  }

  const bodyTopAverage = averageTopIntensities(
    (
      scanResult as {
        body?: {
          measurementData?: {
            intensityTop?: unknown;
          };
        };
      }
    ).body?.measurementData?.intensityTop,
  );
  if (bodyTopAverage !== null) {
    return bodyTopAverage;
  }

  return 0;
}

function normalizeMeasurementTimestamp(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString();
}

function toScanResultPayload(event: JobEventApiResponse): Record<string, unknown> | null {
  const scanResult = event.measurement?.scanResult;
  if (!scanResult || typeof scanResult !== 'object') {
    return null;
  }

  return scanResult;
}

function getLatestTimestampMs(events: JobEventApiResponse[]): number | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const parsed = parseTimestampMs(events[index].timestamp);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function findFirstTimestampMs(
  events: JobEventApiResponse[],
  predicate: (event: JobEventApiResponse) => boolean,
): number | null {
  for (const event of events) {
    if (!predicate(event)) {
      continue;
    }

    const parsed = parseTimestampMs(event.timestamp);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function getRunStartTimestampMs(events: JobEventApiResponse[]): number | null {
  const startedTimestamp = findFirstTimestampMs(
    events,
    (event) => normalizeEventType(event.type) === 'job:started',
  );

  if (startedTimestamp !== null) {
    return startedTimestamp;
  }

  return findFirstTimestampMs(events, (event) => normalizeEventType(event.type) !== 'job:snapshot');
}

function inferElapsedSecondsFromProgress(
  totalPoints: number,
  completedPoints: number,
  scanState: ScanLifecycleState,
): number {
  if (totalPoints <= 0) {
    return 0;
  }

  const baselineTotalSeconds = estimateRouteDurationSeconds(totalPoints);

  if (scanState !== 'running' && completedPoints >= totalPoints) {
    return baselineTotalSeconds;
  }

  if (completedPoints <= 0) {
    return ROUTE_ESTIMATE_STARTUP_SECONDS;
  }

  return Math.min(
    baselineTotalSeconds,
    Math.round(ROUTE_ESTIMATE_STARTUP_SECONDS + completedPoints * ROUTE_ESTIMATE_SECONDS_PER_POINT),
  );
}

function estimateRemainingSeconds(
  totalPoints: number,
  completedPoints: number,
  elapsedSeconds: number,
  scanState: ScanLifecycleState,
): number {
  if (scanState === 'completed' || scanState === 'failed' || scanState === 'stopped') {
    return 0;
  }

  const remainingPoints = Math.max(0, totalPoints - completedPoints);
  if (remainingPoints === 0) {
    return 0;
  }

  const baselineTotalSeconds = estimateRouteDurationSeconds(totalPoints);
  const baselineRemainingSeconds = Math.max(0, baselineTotalSeconds - elapsedSeconds);

  if (completedPoints <= 0 || totalPoints <= 0) {
    return baselineRemainingSeconds;
  }

  const observedWorkSeconds = Math.max(0, elapsedSeconds - ROUTE_ESTIMATE_STARTUP_SECONDS);
  const observedSecondsPerPoint = observedWorkSeconds / completedPoints;
  const observedRemainingSeconds = Math.max(
    0,
    Math.round(remainingPoints * observedSecondsPerPoint),
  );
  const confidence = Math.max(0, Math.min(1, completedPoints / totalPoints));

  return Math.max(
    0,
    Math.round(baselineRemainingSeconds * (1 - confidence) + observedRemainingSeconds * confidence),
  );
}

function getLatestScanState(events: JobEventApiResponse[]): ScanLifecycleState {
  if (events.length === 0) {
    return 'created';
  }

  return toLifecycleState(events[events.length - 1].state);
}

function mapEventsToProgressState(
  events: JobEventApiResponse[],
  liveElapsedOffsetSeconds = 0,
): ProgressTabState {
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
  const completedPointsRaw =
    typeof lastEvent.lastPointProcessed === 'number' &&
    Number.isFinite(lastEvent.lastPointProcessed)
      ? Math.max(0, Math.round(lastEvent.lastPointProcessed))
      : 0;
  const completedPoints =
    totalPoints > 0 ? Math.min(totalPoints, completedPointsRaw) : completedPointsRaw;
  const scanState = toLifecycleState(lastEvent.state);
  const runStartTimestampMs = getRunStartTimestampMs(events);
  const latestTimestampMs = getLatestTimestampMs(events);

  let elapsedSeconds = inferElapsedSecondsFromProgress(totalPoints, completedPoints, scanState);
  if (
    runStartTimestampMs !== null &&
    latestTimestampMs !== null &&
    latestTimestampMs >= runStartTimestampMs
  ) {
    elapsedSeconds = Math.max(0, Math.floor((latestTimestampMs - runStartTimestampMs) / 1000));
  }

  if (scanState === 'running' && liveElapsedOffsetSeconds > 0) {
    elapsedSeconds += liveElapsedOffsetSeconds;
  }

  const estimatedRemainingSeconds = estimateRemainingSeconds(
    totalPoints,
    completedPoints,
    elapsedSeconds,
    scanState,
  );

  return {
    scan: {
      state: scanState,
      completedPoints,
      totalPoints,
      elapsedSeconds,
      estimatedRemainingSeconds,
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
        wavelength: '-',
        intensity: toMeasurementIntensity(event),
        timestamp: normalizeMeasurementTimestamp(event.measurement?.timestamp),
        rawScanResult: toScanResultPayload(event),
        status: normalizeEventType(event.type).includes('completed') ? 'complete' : 'processing',
      })),
    lastEventType: normalizeEventType(lastEvent.type),
  };
}

export function useProgressData(jobId: string | null, isActive = true) {
  const [mockMode] = useMockMode();
  const [recoveredJobId, setRecoveredJobId] = useState<string | null>(null);
  const [isResolvingJob, setIsResolvingJob] = useState(false);
  const [liveElapsedOffsetSeconds, setLiveElapsedOffsetSeconds] = useState(0);
  const [progressState, setProgressState] = useState<ProgressTabState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeJobId = jobId ?? recoveredJobId;
  const { events: jobEvents, error: streamError } = useJobEvents(
    mockMode ? null : activeJobId,
    isActive,
  );
  const hasEvents = jobEvents.length > 0;
  const activeEvents = mockMode ? mockJobEvents : jobEvents;
  const isScanRunning = getLatestScanState(activeEvents) === 'running';
  const latestEventFingerprint = useMemo(() => {
    const lastEvent = activeEvents[activeEvents.length - 1];
    return `${activeJobId ?? 'none'}:${activeEvents.length}:${normalizeEventType(lastEvent?.type)}:${lastEvent?.timestamp ?? '-'}:${lastEvent?.lastPointProcessed ?? '-'}`;
  }, [activeEvents, activeJobId]);

  useEffect(() => {
    setLiveElapsedOffsetSeconds(0);
  }, [latestEventFingerprint]);

  useEffect(() => {
    if (!isActive || !isScanRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setLiveElapsedOffsetSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isScanRunning]);

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
      setProgressState(mapEventsToProgressState(mockJobEvents, liveElapsedOffsetSeconds));
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
  }, [activeJobId, hasEvents, isResolvingJob, liveElapsedOffsetSeconds, mockMode, streamError]);

  const mappedState = useMemo<ProgressTabState | null>(() => {
    if (mockMode) {
      return mapEventsToProgressState(mockJobEvents, liveElapsedOffsetSeconds);
    }

    if (!activeJobId) {
      return null;
    }

    if (!hasEvents && !streamError) {
      return null;
    }

    return mapEventsToProgressState(jobEvents, liveElapsedOffsetSeconds);
  }, [activeJobId, hasEvents, jobEvents, liveElapsedOffsetSeconds, mockMode, streamError]);

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
