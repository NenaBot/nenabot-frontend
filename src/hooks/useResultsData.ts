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
    console.log(`[ResultsData] Loading latest scan result`);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const latestResult = await getLatestScanResult();
      console.log(`[ResultsData] Latest result loaded: ${latestResult.scanId}`);
      setScanResult(latestResult);
      setSelectedScanId(latestResult.scanId);
    } catch (error) {
      console.error('[ResultsData] Failed to load latest scan result:', error);
      setErrorMessage('Failed to load the latest scan result.');
      setScanResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadScanSummaries = useCallback(async () => {
    console.log(`[ResultsData] Loading scan summaries`);
    setIsLoadingScanList(true);

    try {
      const summaries = await getAvailableScanResultSummaries();
      console.log(`[ResultsData] Loaded ${summaries.length} scan summaries`);
      setScanSummaries(summaries);
    } catch (error) {
      console.error('[ResultsData] Failed to load available scan results:', error);
      setScanSummaries([]);
      setErrorMessage('Failed to load scan list.');
    } finally {
      setIsLoadingScanList(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    console.log(`[ResultsData] Refreshing all data`);
    await Promise.all([loadLatestResult(), loadScanSummaries()]);
  }, [loadLatestResult, loadScanSummaries]);

  const loadSelectedScan = useCallback(async () => {
    if (selectedScanId.trim().length === 0) {
      console.log(`[ResultsData] No scan ID selected, skipping load`);
      return;
    }

    console.log(`[ResultsData] Loading selected scan: ${selectedScanId}`);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loadedResult = await getScanResult(selectedScanId);
      console.log(`[ResultsData] Scan ${selectedScanId} loaded successfully`);
      setScanResult(loadedResult);
    } catch (error) {
      console.error(`[ResultsData] Failed to load selected scan ${selectedScanId}:`, error);
      setErrorMessage(`Failed to load scan ${selectedScanId}.`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedScanId]);

  const downloadCurrentScan = useCallback(
    async (format: ExportFormat) => {
      if (!scanResult) {
        console.log(`[ResultsData] No scan result available for download`);
        return;
      }

      console.log(`[ResultsData] Downloading scan ${scanResult.scanId} in ${format} format`);
      setIsDownloading(true);
      setErrorMessage(null);

      try {
        await exportScanResult(scanResult.scanId, format);
        console.log(`[ResultsData] Scan ${scanResult.scanId} exported successfully`);
      } catch (error) {
        console.error(`[ResultsData] Failed to export scan ${scanResult.scanId}:`, error);
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
