import { act, render, screen } from '@testing-library/react';
import { EventLogCard } from '../../../../components/tabs/progress/EventLogCard';
import { ProgressEvent } from '../../../../types/progress.types';

function createEvent(id: number, message: string): ProgressEvent {
  return {
    id,
    time: `10:00:0${id}`,
    level: 'info',
    message,
  };
}

describe('EventLogCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders newest events first', () => {
    render(
      <EventLogCard
        events={[
          createEvent(1, 'job:started'),
          createEvent(2, 'job:waypoint_started'),
          createEvent(3, 'job:waypoint_completed'),
        ]}
      />,
    );

    const messages = screen.getAllByText(/job:/i).map((node) => node.textContent);
    expect(messages).toEqual(['job:waypoint_completed', 'job:waypoint_started', 'job:started']);
  });

  test('animates only newly inserted top event', () => {
    const { rerender } = render(
      <EventLogCard
        events={[createEvent(1, 'job:started'), createEvent(2, 'job:waypoint_started')]}
      />,
    );

    expect(screen.getByTestId('event-log-row-2')).not.toHaveClass('event-log-item-enter');

    rerender(
      <EventLogCard
        events={[
          createEvent(1, 'job:started'),
          createEvent(2, 'job:waypoint_started'),
          createEvent(3, 'job:waypoint_completed'),
        ]}
      />,
    );

    const newestRow = screen.getByTestId('event-log-row-3');
    expect(newestRow).toHaveClass('event-log-item-enter');

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(newestRow).not.toHaveClass('event-log-item-enter');
  });
});
