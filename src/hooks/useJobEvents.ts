import { useEffect, useState } from 'react';
import { JobEventApiResponse, getJobEventsUrl } from '../services/apiCalls';

interface UseJobEventsResult {
  events: JobEventApiResponse[];
  error: string | null;
}

export function useJobEvents(jobId: string | null): UseJobEventsResult {
  const [events, setEvents] = useState<JobEventApiResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`[JobEvents] Setting up SSE for jobId: ${jobId}`);

    if (!jobId) {
      console.log(`[JobEvents] No jobId provided, clearing events`);
      setEvents([]);
      setError(null);
      return;
    }

    const source = new EventSource(getJobEventsUrl(jobId));
    console.log(`[JobEvents] SSE connection opened for job ${jobId}`);

    const handleEvent = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as JobEventApiResponse;
        console.log(`[JobEvents] Received ${event.type}:`, parsed);
        setEvents((prev) => [...prev, parsed]);
      } catch (parseError) {
        console.error('[JobEvents] Failed to parse SSE event payload:', parseError);
      }
    };

    source.addEventListener('job:snapshot', handleEvent as EventListener);
    source.addEventListener('job:started', handleEvent as EventListener);
    source.addEventListener('job:waypoint_started', handleEvent as EventListener);
    source.addEventListener('job:waypoint_completed', handleEvent as EventListener);
    source.addEventListener('job:completed', handleEvent as EventListener);
    source.addEventListener('job:failed', handleEvent as EventListener);
    source.addEventListener('job:stopped', handleEvent as EventListener);

    source.onerror = (event) => {
      console.error(`[JobEvents] SSE connection error for job ${jobId}:`, event);
      setError('SSE connection interrupted.');
    };

    return () => {
      console.log(`[JobEvents] Cleaning up SSE connection for job ${jobId}`);
      source.close();
    };
  }, [jobId]);

  return {
    events,
    error,
  };
}
