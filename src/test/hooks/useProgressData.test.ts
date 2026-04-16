import { renderHook, waitFor } from '@testing-library/react';
import { useProgressData } from '../../hooks/useProgressData';
import { useJobEvents } from '../../hooks/useJobEvents';
import { useMockMode } from '../../hooks/useMockMode';
import { mockJobEvents } from '../../mocks/progressMocks';

jest.mock('../../hooks/useJobEvents', () => ({
  useJobEvents: jest.fn(),
}));

jest.mock('../../hooks/useMockMode', () => ({
  useMockMode: jest.fn(),
}));

jest.mock('../../services/apiCalls', () => ({
  fetchJobs: jest.fn(),
}));

const { fetchJobs } = jest.requireMock('../../services/apiCalls') as {
  fetchJobs: jest.Mock;
};

describe('useProgressData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMockMode as jest.Mock).mockReturnValue([false, jest.fn()]);
    fetchJobs.mockResolvedValue([]);
    (useJobEvents as jest.Mock).mockReturnValue({
      events: [],
      error: null,
    });
  });

  test('returns error when no active job is selected', async () => {
    const { result } = renderHook(() => useProgressData(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.progressState).toBeNull();
    expect(result.current.error).toBe('No active job selected.');
    expect(result.current.activeJobId).toBeNull();
    expect(fetchJobs).toHaveBeenCalledTimes(1);
    expect(useJobEvents).toHaveBeenCalledWith(null, true);
  });

  test('recovers the most recent running job when no job id is provided', async () => {
    fetchJobs.mockResolvedValue([
      { id: 'job-old', status: { state: 'running' } },
      { id: 'job-new', status: { state: 'running' } },
    ]);
    const recoveredEventResponse = {
      events: [
        {
          type: 'job:started',
          state: 'running',
          totalPoints: 5,
          lastPointProcessed: 1,
          timestamp: '2026-03-18T10:00:00.000Z',
        },
      ],
      error: null,
    };
    const emptyEventResponse = {
      events: [],
      error: null,
    };
    (useJobEvents as jest.Mock).mockImplementation((resolvedJobId: string | null) => {
      if (resolvedJobId === 'job-new') {
        return recoveredEventResponse;
      }

      return emptyEventResponse;
    });

    const { result } = renderHook(() => useProgressData(null));

    await waitFor(() => {
      expect(result.current.activeJobId).toBe('job-new');
    });

    expect(fetchJobs).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.progressState?.scan.state).toBe('running');
  });

  test('prefers explicit job id and does not perform recovery lookup', async () => {
    (useJobEvents as jest.Mock).mockReturnValue({
      events: [
        {
          type: 'job:started',
          state: 'running',
          totalPoints: 4,
          lastPointProcessed: 0,
          timestamp: '2026-03-18T10:00:00.000Z',
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useProgressData('job-direct'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activeJobId).toBe('job-direct');
    expect(fetchJobs).not.toHaveBeenCalled();
    expect(useJobEvents).toHaveBeenCalledWith('job-direct', true);
  });

  test('maps SSE events into progress, events, and measurements', async () => {
    (useJobEvents as jest.Mock).mockReturnValue({
      events: [
        {
          type: 'job:started',
          state: 'running',
          totalPoints: 10,
          lastPointProcessed: 3,
          timestamp: '2026-03-18T10:00:00.000Z',
        },
        {
          type: 'job:waypoint_completed',
          state: 'running',
          totalPoints: 10,
          lastPointProcessed: 4,
          timestamp: '2026-03-18T10:00:01.000Z',
          measurement: {
            waypointIndex: 4,
          },
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useProgressData('job-1'));

    await waitFor(() => {
      expect(result.current.progressState).not.toBeNull();
    });

    expect(result.current.progressState?.scan.state).toBe('running');
    expect(result.current.progressState?.scan.totalPoints).toBe(10);
    expect(result.current.progressState?.scan.completedPoints).toBe(4);
    expect(result.current.progressState?.events[0].level).toBe('success');
    expect(result.current.progressState?.events[1].level).toBe('success');
    expect(result.current.progressState?.measurements).toHaveLength(1);
    expect(result.current.progressState?.measurements[0]).toEqual(
      expect.objectContaining({
        point: 'WP-4',
        intensity: 0,
        status: 'complete',
      }),
    );
  });

  test('extracts measured intensity from measurement scanResult', async () => {
    (useJobEvents as jest.Mock).mockReturnValue({
      events: [
        {
          type: 'job:waypoint_completed',
          state: 'running',
          totalPoints: 12,
          lastPointProcessed: 5,
          timestamp: '2026-03-18T10:00:01.000Z',
          measurement: {
            waypointIndex: 5,
            scanResult: {
              measuredValue: 0.63,
            },
          },
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useProgressData('job-1'));

    await waitFor(() => {
      expect(result.current.progressState?.measurements).toHaveLength(1);
    });

    expect(result.current.progressState?.measurements[0]).toEqual(
      expect.objectContaining({
        point: 'WP-5',
        intensity: 0.63,
        status: 'complete',
      }),
    );
  });

  test('propagates stream error message', async () => {
    (useJobEvents as jest.Mock).mockReturnValue({
      events: [],
      error: 'SSE connection interrupted.',
    });

    const { result } = renderHook(() => useProgressData('job-2'));

    await waitFor(() => {
      expect(result.current.error).toBe('SSE connection interrupted.');
    });
  });

  test('stays loading until progress events arrive', async () => {
    (useJobEvents as jest.Mock).mockReturnValue({
      events: [],
      error: null,
    });

    const { result, rerender } = renderHook(({ jobId }) => useProgressData(jobId), {
      initialProps: { jobId: 'job-4' as string | null },
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.progressState).toBeNull();

    (useJobEvents as jest.Mock).mockReturnValue({
      events: [
        {
          type: 'job:started',
          state: 'running',
          totalPoints: 8,
          lastPointProcessed: 0,
          timestamp: '2026-03-18T10:00:00.000Z',
        },
      ],
      error: null,
    });

    rerender({ jobId: 'job-4' });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.progressState?.scan.state).toBe('running');
    expect(result.current.progressState?.scan.totalPoints).toBe(8);
  });

  test('uses mock progress state when mock mode is enabled', async () => {
    (useMockMode as jest.Mock).mockReturnValue([true, jest.fn()]);

    const { result } = renderHook(() => useProgressData(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.progressState?.scan.state).toBe('running');
    expect(result.current.progressState?.scan.totalPoints).toBe(10);
    expect(result.current.progressState?.scan.completedPoints).toBe(4);
    expect(result.current.progressState?.events).toHaveLength(mockJobEvents.length);
    expect(result.current.progressState?.measurements[0]).toEqual(
      expect.objectContaining({
        point: 'WP-4',
        intensity: 0.87,
        status: 'complete',
      }),
    );
    expect(result.current.error).toBeNull();
    expect(result.current.activeJobId).toBeNull();
    expect(fetchJobs).not.toHaveBeenCalled();
    expect(useJobEvents).toHaveBeenCalledWith(null, true);
  });
});
