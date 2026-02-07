import { useState, useEffect } from 'react';
import { HardwareData } from '../types/hardware.types';
import { mockHardwareData } from '../mocks/hardwareMocks';
import { apiClient } from '../services/apiClient';

interface UseHardwareDataReturn {
  spectrometer: HardwareData | null;
  camera: HardwareData | null;
  robotarm: HardwareData | null;
  isLoading: boolean;
  error: Error | null;
}

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

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
  const [data, setData] = useState<{
    spectrometer: HardwareData | null;
    camera: HardwareData | null;
    robotarm: HardwareData | null;
  }>({
    spectrometer: null,
    camera: null,
    robotarm: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (USE_MOCK_DATA) {
          // Use mock data for development
          setData(mockHardwareData);
        } else {
          // Fetch real data from API
          const response = await apiClient.get<{
            spectrometer: HardwareData;
            camera: HardwareData;
            robotarm: HardwareData;
          }>('/api/hardware/status');
          setData(response);
        }
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Failed to fetch hardware data:', error);
        setError(error);
        // Fall back to mock data on error
        setData(mockHardwareData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    ...data,
    isLoading,
    error
  };
}

/**
 * Hook for fetching real-time hardware data with polling.
 * Automatically refreshes data at specified interval.
 * 
 * @param intervalMs - Polling interval in milliseconds (default: 1000)
 */
export function useHardwareDataPolling(intervalMs: number = 1000): UseHardwareDataReturn {
  const [data, setData] = useState<{
    spectrometer: HardwareData | null;
    camera: HardwareData | null;
    robotarm: HardwareData | null;
  }>({
    spectrometer: null,
    camera: null,
    robotarm: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (USE_MOCK_DATA) {
          // Update mock data with current timestamp
          setData({
            spectrometer: { ...mockHardwareData.spectrometer, lastUpdate: new Date() },
            camera: { ...mockHardwareData.camera, lastUpdate: new Date() },
            robotarm: { ...mockHardwareData.robotarm, lastUpdate: new Date() }
          });
        } else {
          // Fetch real data from API
          const response = await apiClient.get<{
            spectrometer: HardwareData;
            camera: HardwareData;
            robotarm: HardwareData;
          }>('/api/hardware/status');
          setData(response);
        }
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Failed to fetch hardware data:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return {
    ...data,
    isLoading,
    error
  };
}
