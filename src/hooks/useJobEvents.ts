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
    if (!jobId) {
      setEvents([]);
      setError(null);
      return;
    }

    const source = new EventSource(getJobEventsUrl(jobId));

    const handleEvent = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as JobEventApiResponse;
        setEvents((prev) => [...prev, parsed]);
      } catch (parseError) {
        console.error('Failed to parse SSE event payload:', parseError);
      }
    };

    source.addEventListener('job:snapshot', handleEvent as EventListener);
    source.addEventListener('job:started', handleEvent as EventListener);
    source.addEventListener('job:waypoint_started', handleEvent as EventListener);
    source.addEventListener('job:waypoint_completed', handleEvent as EventListener);
    source.addEventListener('job:completed', handleEvent as EventListener);
    source.addEventListener('job:failed', handleEvent as EventListener);
    source.addEventListener('job:stopped', handleEvent as EventListener);

    source.onerror = () => {
      setError('SSE connection interrupted.');
    };

    return () => {
      source.close();
    };
  }, [jobId]);

  return {
    events,
    error,
  };
}
