import { useCallback, useEffect, useRef, useState } from 'react';
import { HardwareData } from '../types/hardware.types';
import { mockHardwareData } from '../mocks/hardwareMocks';
import { fetchHardwareStatus, HardwareStatusApiResponse } from '../services/apiCalls';

type HardwareDataMap = {
  spectrometer: HardwareData | null;
  camera: HardwareData | null;
  robotarm: HardwareData | null;
};

interface UseHardwareDataReturn {
  spectrometer: HardwareData | null;
  camera: HardwareData | null;
  robotarm: HardwareData | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

function normalizeHardwareData(data: HardwareStatusApiResponse): HardwareDataMap {
  const normalizeDevice = (device: HardwareStatusApiResponse[keyof HardwareStatusApiResponse]) => {
    if (!device) {
      return null;
    }

    return {
      ...device,
      lastUpdate:
        device.lastUpdate instanceof Date ? device.lastUpdate : new Date(device.lastUpdate),
    } as HardwareData;
  };

  return {
    spectrometer: normalizeDevice(data.spectrometer),
    camera: normalizeDevice(data.camera),
    robotarm: normalizeDevice(data.robotarm),
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
    spectrometer: null,
    camera: null,
    robotarm: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      if (USE_MOCK_DATA) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setData(mockHardwareData);
        setLastUpdated(new Date());
      } else {
        const response = await fetchHardwareStatus();

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setData(normalizeHardwareData(response));
        setLastUpdated(new Date());
      }
      setError(null);
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      console.error('Failed to fetch hardware data:', fetchError);
      setError(fetchError);
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
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
    spectrometer: null,
    camera: null,
    robotarm: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      if (USE_MOCK_DATA) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setData({
          spectrometer: { ...mockHardwareData.spectrometer, lastUpdate: new Date() },
          camera: { ...mockHardwareData.camera, lastUpdate: new Date() },
          robotarm: { ...mockHardwareData.robotarm, lastUpdate: new Date() },
        });
        setLastUpdated(new Date());
      } else {
        const response = await fetchHardwareStatus();

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setData(normalizeHardwareData(response));
        setLastUpdated(new Date());
      }
      setError(null);
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      console.error('Failed to fetch hardware data:', fetchError);
      setError(fetchError);
    } finally {
      inFlightRef.current = false;

      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
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
