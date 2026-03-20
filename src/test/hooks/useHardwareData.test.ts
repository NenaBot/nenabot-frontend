import { act, renderHook, waitFor } from '@testing-library/react';
import { useHardwareData, useHardwareDataPolling } from '../../hooks/useHardwareData';
import { fetchHealthStatus } from '../../services/apiCalls';
import { isMockModeEnabled } from '../../state/mockMode';

jest.mock('../../services/apiCalls', () => ({
  fetchHealthStatus: jest.fn(),
}));

jest.mock('../../state/mockMode', () => ({
  isMockModeEnabled: jest.fn(),
}));

const livePayload = {
  status: 'ok',
  uptimeSeconds: 120,
  dms: { status: 'ok', error: null },
  camera: { status: 'degraded', error: null },
  robot: { status: 'failed', error: 'joint issue' },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useHardwareData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (isMockModeEnabled as jest.Mock).mockReturnValue(false);
    (fetchHealthStatus as jest.Mock).mockResolvedValue(livePayload);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loads and normalizes live health payload', async () => {
    const { result } = renderHook(() => useHardwareData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchHealthStatus).toHaveBeenCalledTimes(1);
    expect(result.current.dms?.status).toBe('online');
    expect(result.current.camera?.status).toBe('warning');
    expect(result.current.robot?.status).toBe('error');
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  test('uses mock data when mock mode is enabled', async () => {
    (isMockModeEnabled as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useHardwareData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchHealthStatus).not.toHaveBeenCalled();
    expect(result.current.dms).not.toBeNull();
    expect(result.current.camera).not.toBeNull();
    expect(result.current.robot).not.toBeNull();
  });

  test('exposes fetch errors', async () => {
    (fetchHealthStatus as jest.Mock).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useHardwareData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(expect.objectContaining({ message: 'network down' }));
  });

  test('polling hook avoids overlapping requests while in flight', async () => {
    jest.useFakeTimers();

    const first = deferred<typeof livePayload>();
    (fetchHealthStatus as jest.Mock).mockReturnValue(first.promise);

    renderHook(() => useHardwareDataPolling(50));

    expect(fetchHealthStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    expect(fetchHealthStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.resolve(livePayload);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(60);
    });

    expect(fetchHealthStatus).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
