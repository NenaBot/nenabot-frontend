import { fireEvent, render, screen } from '@testing-library/react';
import { ProgressTab } from '../tabs/ProgressTab';
import { ProgressTabState } from '../../types/progress.types';

jest.mock('../../hooks/useProgressData', () => ({
  useProgressData: jest.fn(),
}));

jest.mock('../../services/apiCalls', () => ({
  deleteJob: jest.fn(),
}));

jest.mock('../../state/mockMode', () => ({
  isMockModeEnabled: jest.fn(() => false),
}));

jest.mock('../CameraView', () => ({
  CameraView: ({ title }: { title: string }) => <div>{title}</div>,
}));

jest.mock('../tabs/progress/CurrentScanStatusCard', () => ({
  CurrentScanStatusCard: ({ scan }: { scan: { state: string } }) => <div>Scan: {scan.state}</div>,
}));

jest.mock('../tabs/progress/EventLogCard', () => ({
  EventLogCard: () => <div>Event Log</div>,
}));

jest.mock('../tabs/progress/MeasurementLogCard', () => ({
  MeasurementLogCard: () => <div>Measurement Log</div>,
}));

const { useProgressData } = jest.requireMock('../../hooks/useProgressData') as {
  useProgressData: jest.Mock;
};

function createState(
  scanOverrides?: Partial<ProgressTabState['scan']>,
  lastEventType = 'job:waypoint_started',
): ProgressTabState {
  return {
    scan: {
      state: 'running',
      completedPoints: 1,
      totalPoints: 10,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 9,
      ...scanOverrides,
    },
    events: [],
    measurements: [],
    lastEventType,
  };
}

describe('ProgressTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('does not crash when transitioning from loading to loaded state', () => {
    useProgressData
      .mockReturnValueOnce({ progressState: null, isLoading: true, error: null })
      .mockReturnValueOnce({ progressState: createState(), isLoading: false, error: null });

    const { rerender } = render(<ProgressTab jobId="job-1" onNext={jest.fn()} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<ProgressTab jobId="job-1" onNext={jest.fn()} />);
    expect(screen.getByText('Scan Progress')).toBeInTheDocument();
  });

  test('shows manual results CTA when scan is terminal and auto-navigation callback is missing', () => {
    useProgressData.mockReturnValue({
      progressState: createState(
        { state: 'completed', completedPoints: 10, totalPoints: 10 },
        'job:completed',
      ),
      isLoading: false,
      error: null,
    });

    render(<ProgressTab jobId="job-1" />);

    expect(
      screen.getByText(/auto-navigation is unavailable; open the Results tab/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Results' })).toBeDisabled();
  });

  test('allows manual go-to-results action when terminal and onNext exists', () => {
    const onNext = jest.fn();
    useProgressData.mockReturnValue({
      progressState: createState(
        { state: 'stopped', completedPoints: 10, totalPoints: 10 },
        'job:stopped',
      ),
      isLoading: false,
      error: null,
    });

    render(<ProgressTab jobId="job-1" onNext={onNext} />);

    const cta = screen.getByRole('button', { name: 'Go to Results' });
    expect(cta).toBeEnabled();
    fireEvent.click(cta);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('auto-advances one second after receiving a live terminal transition event', () => {
    jest.useFakeTimers();
    const onNext = jest.fn();
    useProgressData.mockReturnValue({
      progressState: createState(
        { state: 'completed', completedPoints: 10, totalPoints: 10 },
        'job:completed',
      ),
      isLoading: false,
      error: null,
    });

    render(<ProgressTab jobId="job-1" onNext={onNext} />);

    expect(onNext).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('does not auto-advance for terminal reconnect snapshots', () => {
    jest.useFakeTimers();
    const onNext = jest.fn();
    useProgressData.mockReturnValue({
      progressState: createState(
        { state: 'completed', completedPoints: 10, totalPoints: 10 },
        'job:snapshot',
      ),
      isLoading: false,
      error: null,
    });

    render(<ProgressTab jobId="job-1" onNext={onNext} />);

    expect(onNext).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(onNext).not.toHaveBeenCalled();
  });
});
