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

  test('renders waiting empty-state notice when there are no events', () => {
    render(<EventLogCard events={[]} />);

    expect(screen.getByText('Waiting for scan events...')).toBeInTheDocument();
  });

  test('animates only newly inserted top event', () => {
    const { rerender } = render(
      <EventLogCard
        events={[createEvent(1, 'job:started'), createEvent(2, 'job:waypoint_started')]}
      />,
    );

    expect(screen.getByTestId('event-log-row-2')).not.toHaveClass('progress-log-item-enter');
    expect(screen.getByTestId('event-log-row-2')).not.toHaveClass('progress-log-item-push');

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
    const shiftedRow = screen.getByTestId('event-log-row-2');
    expect(newestRow).toHaveClass('progress-log-item-enter');
    expect(shiftedRow).toHaveClass('progress-log-item-push');

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(newestRow).not.toHaveClass('progress-log-item-enter');
    expect(shiftedRow).not.toHaveClass('progress-log-item-push');
  });
});
