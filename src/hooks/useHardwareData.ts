import { useState, useEffect } from 'react';
import { HardwareData } from '../types/hardware.types';
import { mockHardwareData } from '../mocks/hardwareMocks';
import { apiClient } from '../services/apiClient';

type HardwareDataMap = {
  spectrometer: HardwareData | null;
  camera: HardwareData | null;
  robotarm: HardwareData | null;
};

type HardwareAPIDataMap = {
  spectrometer: (Omit<HardwareData, 'lastUpdate'> & { lastUpdate: string | Date }) | null;
  camera: (Omit<HardwareData, 'lastUpdate'> & { lastUpdate: string | Date }) | null;
  robotarm: (Omit<HardwareData, 'lastUpdate'> & { lastUpdate: string | Date }) | null;
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

function normalizeHardwareData(data: HardwareAPIDataMap): HardwareDataMap {
  const normalizeDevice = (device: HardwareAPIDataMap[keyof HardwareAPIDataMap]) => {
    if (!device) {
      return null;
    }

    return {
      ...device,
      lastUpdate: device.lastUpdate instanceof Date
        ? device.lastUpdate
        : new Date(device.lastUpdate),
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
    robotarm: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      if (USE_MOCK_DATA) {
        setData(mockHardwareData);
        setLastUpdated(new Date());
      } else {
        const response = await apiClient.get<HardwareAPIDataMap>('/api/hardware/status');
        setData(normalizeHardwareData(response));
        setLastUpdated(new Date());
      }
      setError(null);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      console.error('Failed to fetch hardware data:', fetchError);
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    robotarm: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      if (USE_MOCK_DATA) {
        setData({
          spectrometer: { ...mockHardwareData.spectrometer, lastUpdate: new Date() },
          camera: { ...mockHardwareData.camera, lastUpdate: new Date() },
          robotarm: { ...mockHardwareData.robotarm, lastUpdate: new Date() }
        });
        setLastUpdated(new Date());
      } else {
        const response = await apiClient.get<HardwareAPIDataMap>('/api/hardware/status');
        setData(normalizeHardwareData(response));
        setLastUpdated(new Date());
      }
      setError(null);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      console.error('Failed to fetch hardware data:', fetchError);
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return {
    ...data,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
