import { useCallback, useEffect, useRef, useState } from 'react';
import { HardwareData } from '../types/hardware.types';
import { mockHardwareData } from '../mocks/hardwareMocks';
import { fetchHealthStatus, HealthApiResponse } from '../services/apiCalls';
import { isMockModeEnabled } from '../state/mockMode';

type HardwareDataMap = {
  dms: HardwareData | null;
  camera: HardwareData | null;
  robot: HardwareData | null;
};

interface UseHardwareDataReturn {
  dms: HardwareData | null;
  camera: HardwareData | null;
  robot: HardwareData | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

function normalizeHealthStatus(status: string): HardwareData['status'] {
  const normalized = status.trim().toLowerCase();

  if (normalized === 'ok' || normalized === 'online' || normalized === 'healthy') {
    return 'online';
  }

  if (normalized === 'warning' || normalized === 'degraded') {
    return 'warning';
  }

  if (normalized === 'error' || normalized === 'failed') {
    return 'error';
  }

  if (normalized === 'idle') {
    return 'idle';
  }

  return 'offline';
}

function normalizeHardwareData(data: HealthApiResponse): HardwareDataMap {
  const now = new Date();
  const uptime =
    typeof data.uptimeSeconds === 'number' && Number.isFinite(data.uptimeSeconds)
      ? Math.max(0, Math.round(data.uptimeSeconds))
      : 0;

  return {
    dms: {
      id: 'dms',
      type: 'dms',
      title: 'DMS',
      status: normalizeHealthStatus(data.dms.status),
      lastUpdate: now,
      metrics: [
        { label: 'Service', value: data.dms.status },
        { label: 'Uptime', value: uptime, unit: 's' },
        { label: 'Error', value: data.dms.error ? data.dms.error : 'None' },
      ],
    },
    camera: {
      id: 'camera',
      type: 'camera',
      title: 'Camera',
      status: normalizeHealthStatus(data.camera.status),
      lastUpdate: now,
      metrics: [
        { label: 'Service', value: data.camera.status },
        { label: 'Uptime', value: uptime, unit: 's' },
        { label: 'Error', value: data.camera.error ? data.camera.error : 'None' },
      ],
    },
    robot: {
      id: 'robot',
      type: 'robot',
      title: 'Robot Arm',
      status: normalizeHealthStatus(data.robot.status),
      lastUpdate: now,
      metrics: [
        { label: 'Service', value: data.robot.status },
        { label: 'Uptime', value: uptime, unit: 's' },
        { label: 'Error', value: data.robot.error ? data.robot.error : 'None' },
      ],
    },
  };
}

/**
 * Hook for fetching hardware data from the backend API.
 * Automatically uses mock data in development if VITE_USE_MOCK_DATA=true
 *
 * Usage:
 * ```tsx
 * const { spectrometer, camera, robotarm, isLoading, error } = useHardwareData();
 * ```
 */
export function useHardwareData(): UseHardwareDataReturn {
  const [data, setData] = useState<HardwareDataMap>({
    dms: null,
    camera: null,
    robot: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    console.log(`[HardwareData] Fetching data (request ${requestId})`);

    try {
      if (isMockModeEnabled()) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          console.log(`[HardwareData] Request ${requestId} cancelled (unmounted or superseded)`);
          return;
        }

        console.log(`[HardwareData] Using mock data`);
        setData(mockHardwareData);
        setLastUpdated(new Date());
      } else {
        console.log(`[HardwareData] Fetching from API`);
        const response = await fetchHealthStatus();

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          console.log(`[HardwareData] Request ${requestId} cancelled (unmounted or superseded)`);
          return;
        }

        const normalizedData = normalizeHardwareData(response);
        console.log(`[HardwareData] API response normalized:`, normalizedData);
        setData(normalizedData);
        setLastUpdated(new Date());
      }
      setError(null);
      console.log(`[HardwareData] Data fetch successful`);
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        console.log(`[HardwareData] Request ${requestId} cancelled (unmounted or superseded)`);
        return;
      }

      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      console.error('[HardwareData] Failed to fetch hardware data:', fetchError);
      setError(fetchError);
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
        console.log(`[HardwareData] Request ${requestId} completed`);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    ...data,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}

/**
 * Hook for fetching real-time hardware data with polling.
 * Automatically refreshes data at specified interval.
 *
 * @param intervalMs - Polling interval in milliseconds (default: 1000)
 */
export function useHardwareDataPolling(intervalMs: number = 1000): UseHardwareDataReturn {
  const [data, setData] = useState<HardwareDataMap>({
    dms: null,
    camera: null,
    robot: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (inFlightRef.current) {
      console.log(`[HardwareDataPolling] Request already in flight, skipping`);
      return;
    }

    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    console.log(
      `[HardwareDataPolling] Fetching data (request ${requestId}, interval: ${intervalMs}ms)`,
    );

    try {
      if (isMockModeEnabled()) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          console.log(
            `[HardwareDataPolling] Request ${requestId} cancelled (unmounted or superseded)`,
          );
          return;
        }

        console.log(`[HardwareDataPolling] Using mock data`);
        setData({
          dms: { ...mockHardwareData.dms, lastUpdate: new Date() },
          camera: { ...mockHardwareData.camera, lastUpdate: new Date() },
          robot: { ...mockHardwareData.robot, lastUpdate: new Date() },
        });
        setLastUpdated(new Date());
      } else {
        console.log(`[HardwareDataPolling] Fetching from API`);
        const response = await fetchHealthStatus();

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          console.log(
            `[HardwareDataPolling] Request ${requestId} cancelled (unmounted or superseded)`,
          );
          return;
        }

        const normalizedData = normalizeHardwareData(response);
        console.log(`[HardwareDataPolling] API response normalized:`, normalizedData);
        setData(normalizedData);
        setLastUpdated(new Date());
      }
      setError(null);
      console.log(`[HardwareDataPolling] Data fetch successful`);
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        console.log(
          `[HardwareDataPolling] Request ${requestId} cancelled (unmounted or superseded)`,
        );
        return;
      }

      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      console.error('[HardwareDataPolling] Failed to fetch hardware data:', fetchError);
      setError(fetchError);
    } finally {
      inFlightRef.current = false;

      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
        console.log(`[HardwareDataPolling] Request ${requestId} completed`);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData, intervalMs]);

  return {
    ...data,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
