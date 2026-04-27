import { act, render, screen } from '@testing-library/react';
import { MeasurementLogCard } from '../../../../components/tabs/progress/MeasurementLogCard';
import { ScanMeasurement } from '../../../../types/progress.types';

function createMeasurement(
  id: number,
  point: string,
  intensity: number,
  status: ScanMeasurement['status'] = 'complete',
): ScanMeasurement {
  return {
    id,
    point,
    intensity,
    timestamp: `10:00:0${id}`,
    rawScanResult: null,
    status,
  };
}

describe('MeasurementLogCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders newest measurements first', () => {
    render(
      <MeasurementLogCard
        measurements={[
          createMeasurement(1, 'WP-1', 0.45),
          createMeasurement(2, 'WP-2', 0.78),
          createMeasurement(3, 'WP-3', 1.2),
        ]}
      />,
    );

    const points = screen.getAllByText(/^WP-/i).map((node) => node.textContent);
    expect(points).toEqual(['WP-3', 'WP-2', 'WP-1']);
  });

  test('renders waiting empty-state notice when there are no measurements', () => {
    render(<MeasurementLogCard measurements={[]} />);

    expect(screen.getByText('Waiting for measurements...')).toBeInTheDocument();
  });

  test('animates only newly inserted top measurement', () => {
    const { rerender } = render(
      <MeasurementLogCard
        measurements={[createMeasurement(1, 'WP-1', 0.45), createMeasurement(2, 'WP-2', 0.78)]}
      />,
    );

    expect(screen.getByTestId('measurement-log-row-2')).not.toHaveClass('progress-log-item-enter');
    expect(screen.getByTestId('measurement-log-row-2')).not.toHaveClass('progress-log-item-push');

    rerender(
      <MeasurementLogCard
        measurements={[
          createMeasurement(1, 'WP-1', 0.45),
          createMeasurement(2, 'WP-2', 0.78),
          createMeasurement(3, 'WP-3', 1.2, 'processing'),
        ]}
      />,
    );

    const newestRow = screen.getByTestId('measurement-log-row-3');
    const shiftedRow = screen.getByTestId('measurement-log-row-2');
    expect(newestRow).toHaveClass('progress-log-item-enter');
    expect(shiftedRow).toHaveClass('progress-log-item-push');

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(newestRow).not.toHaveClass('progress-log-item-enter');
    expect(shiftedRow).not.toHaveClass('progress-log-item-push');
  });
});
