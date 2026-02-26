import { AlertTriangle, CheckCircle } from 'lucide-react';
import { ProgressEvent } from './progress.model';

interface EventLogCardProps {
  events: ProgressEvent[];
}

/**
 * Displays chronological scan events. Event type drives visual indicator.
 */
export function EventLogCard({ events }: EventLogCardProps) {
  return (
    <section className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <h3 className="text-sm font-medium">Event Log</h3>
      </div>
      <div className="p-4 max-h-62.5 overflow-y-auto">
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
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
