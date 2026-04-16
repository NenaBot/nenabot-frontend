import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useTopInsertListAnimation } from '../../../hooks/useTopInsertListAnimation';
import { ProgressEvent } from '../../../types/progress.types';
import { ProgressLogCard } from './ProgressLogCard';

interface EventLogCardProps {
  events: ProgressEvent[];
}

/**
 * Displays chronological scan events. Event type drives visual indicator.
 */
export function EventLogCard({ events }: EventLogCardProps) {
  const { displayItems: displayEvents, enteringItemId, isPushingExistingItems } =
    useTopInsertListAnimation(events);

  return (
    <ProgressLogCard
      title="Event Log"
      isEmpty={displayEvents.length === 0}
      emptyMessage="Waiting for scan events..."
    >
      <div className="space-y-2">
        {displayEvents.map((event) => {
          const enterClass = enteringItemId === event.id ? 'progress-log-item-enter' : '';
          const pushClass =
            isPushingExistingItems && enteringItemId !== event.id ? 'progress-log-item-push' : '';

          return (
            <div
              key={event.id}
              data-testid={`event-log-row-${event.id}`}
              className={`flex items-start gap-3 p-2 rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-colors ${enterClass} ${pushClass}`.trim()}
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
                <div className="text-xs text-(--md-sys-color-on-surface-variant) mb-0.5">
                  {event.time}
                </div>
                <div className="text-sm text-(--md-sys-color-on-surface)">{event.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </ProgressLogCard>
  );
}
