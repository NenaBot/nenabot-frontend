import { useCallback, useEffect, useState } from 'react';
import { ScanResult, ScanResultSummary } from '../types/results.types';
import {
  getAvailableScanResultSummaries,
  getLatestScanResult,
  getScanResult,
} from '../services/resultsApi';
import { exportScanResult } from '../services/resultsApi/exportScanResult';

type ExportFormat = 'json' | 'csv';

interface UseResultsDataReturn {
  scanResult: ScanResult | null;
  scanSummaries: ScanResultSummary[];
  selectedScanId: string;
  setSelectedScanId: (scanId: string) => void;
  isLoading: boolean;
  isLoadingScanList: boolean;
  isDownloading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  loadSelectedScan: () => Promise<void>;
  downloadCurrentScan: (format: ExportFormat) => Promise<void>;
}

export function useResultsData(initialScanId?: string | null): UseResultsDataReturn {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanSummaries, setScanSummaries] = useState<ScanResultSummary[]>([]);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingScanList, setIsLoadingScanList] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLatestResult = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const latestResult = await getLatestScanResult();
      setScanResult(latestResult);
      setSelectedScanId(latestResult.scanId);
    } catch (error) {
      console.error('Failed to load latest scan result:', error);
      setErrorMessage('Failed to load the latest scan result.');
      setScanResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadScanSummaries = useCallback(async () => {
    setIsLoadingScanList(true);

    try {
      const summaries = await getAvailableScanResultSummaries();
      setScanSummaries(summaries);
    } catch (error) {
      console.error('Failed to load available scan results:', error);
      setScanSummaries([]);
      setErrorMessage('Failed to load scan list.');
    } finally {
      setIsLoadingScanList(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadLatestResult(), loadScanSummaries()]);
  }, [loadLatestResult, loadScanSummaries]);

  const loadSelectedScan = useCallback(async () => {
    if (selectedScanId.trim().length === 0) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loadedResult = await getScanResult(selectedScanId);
      setScanResult(loadedResult);
    } catch (error) {
      console.error('Failed to load selected scan result:', error);
      setErrorMessage(`Failed to load scan ${selectedScanId}.`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedScanId]);

  const downloadCurrentScan = useCallback(
    async (format: ExportFormat) => {
      if (!scanResult) {
        return;
      }

      setIsDownloading(true);
      setErrorMessage(null);

      try {
        await exportScanResult(scanResult.scanId, format);
      } catch (error) {
        console.error('Failed to export scan result:', error);
        setErrorMessage('Failed to export scan result.');
      } finally {
        setIsDownloading(false);
      }
    },
    [scanResult],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (initialScanId && initialScanId.trim().length > 0) {
      setSelectedScanId(initialScanId);
    }
  }, [initialScanId]);

  return {
    scanResult,
    scanSummaries,
    selectedScanId,
    setSelectedScanId,
    isLoading,
    isLoadingScanList,
    isDownloading,
    errorMessage,
    refresh,
    loadSelectedScan,
    downloadCurrentScan,
  };
}
