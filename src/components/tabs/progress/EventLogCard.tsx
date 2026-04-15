import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { ProgressEvent } from '../../../types/progress.types';

interface EventLogCardProps {
  events: ProgressEvent[];
}

/**
 * Displays chronological scan events. Event type drives visual indicator.
 */
export function EventLogCard({ events }: EventLogCardProps) {
  const displayEvents = useMemo(() => [...events].reverse(), [events]);
  const [enteringEventId, setEnteringEventId] = useState<number | null>(null);
  const previousTopEventIdRef = useRef<number | null>(null);

  useEffect(() => {
    const newestEventId = displayEvents[0]?.id ?? null;

    if (newestEventId === null) {
      previousTopEventIdRef.current = null;
      setEnteringEventId(null);
      return;
    }

    // Skip first paint animation and animate only new top insertions.
    if (previousTopEventIdRef.current !== null && newestEventId !== previousTopEventIdRef.current) {
      setEnteringEventId(newestEventId);
      const timer = window.setTimeout(() => {
        setEnteringEventId((current) => (current === newestEventId ? null : current));
      }, 220);

      previousTopEventIdRef.current = newestEventId;
      return () => window.clearTimeout(timer);
    }

    previousTopEventIdRef.current = newestEventId;
    return;
  }, [displayEvents]);

  return (
    <section className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <h3 className="text-sm font-medium">Event Log</h3>
      </div>
      <div className="p-4 max-h-62.5 overflow-y-auto">
        <div className="space-y-2">
          {displayEvents.map((event) => (
            <div
              key={event.id}
              data-testid={`event-log-row-${event.id}`}
              className={`flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors ${enteringEventId === event.id ? 'event-log-item-enter' : ''}`}
            >
              {event.level === 'success' && (
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              )}
              {event.level === 'info' && (
                <div className="w-4 h-4 rounded-full border-2 border-blue-600 mt-0.5 shrink-0" />
              )}
              {event.level === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  {event.time}
                </div>
                <div className="text-sm text-[var(--md-sys-color-on-surface)]">{event.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
