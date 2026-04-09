import { useEffect, useMemo, useState } from 'react';
import { mockJobEvents } from '../mocks/progressMocks';
import { JobEventApiResponse } from '../services/apiCalls';
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
        wavelength: '-',
        intensity: toMeasurementIntensity(event),
        status: normalizeEventType(event.type).includes('completed') ? 'complete' : 'processing',
      })),
  };
}

export function useProgressData(jobId: string | null) {
  const [mockMode] = useMockMode();
  const [progressState, setProgressState] = useState<ProgressTabState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { events: jobEvents, error: streamError } = useJobEvents(mockMode ? null : jobId);
  const hasEvents = jobEvents.length > 0;

  useEffect(() => {
    if (mockMode) {
      setProgressState(mapEventsToProgressState(mockJobEvents));
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(null);

    if (!jobId) {
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
  }, [hasEvents, jobId, mockMode, streamError]);

  const mappedState = useMemo<ProgressTabState | null>(() => {
    if (mockMode) {
      return mapEventsToProgressState(mockJobEvents);
    }

    if (!jobId) {
      return null;
    }

    if (!hasEvents && !streamError) {
      return null;
    }

    return mapEventsToProgressState(jobEvents);
  }, [hasEvents, jobEvents, jobId, mockMode, streamError]);

  useEffect(() => {
    setProgressState(mappedState);
  }, [mappedState]);

  useEffect(() => {
    if (streamError) {
      setError(streamError);
      setIsLoading(false);
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
