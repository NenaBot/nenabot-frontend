import { act, renderHook, waitFor } from '@testing-library/react';
import { useResultsData } from '../../hooks/useResultsData';
import {
  getAvailableScanResultSummaries,
  getLatestScanResult,
  getScanResult,
} from '../../services/resultsApi';
import { exportScanResult } from '../../services/resultsApi/exportScanResult';

jest.mock('../../services/resultsApi/index', () => ({
  getLatestScanResult: jest.fn(),
  getAvailableScanResultSummaries: jest.fn(),
  getScanResult: jest.fn(),
}));

jest.mock('../../services/resultsApi/exportScanResult', () => ({
  exportScanResult: jest.fn(),
}));

const latest = {
  scanId: 'scan-1',
  createdAt: '2026-03-18T10:00:00.000Z',
  sourceName: 'latest',
  previewImageUrl: null,
  routePath: [],
  measurementPoints: [],
};

const scanTwo = {
  scanId: 'scan-2',
  createdAt: '2026-03-18T10:01:00.000Z',
  sourceName: 'scan two',
  previewImageUrl: null,
  routePath: [],
  measurementPoints: [],
};

describe('useResultsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (getLatestScanResult as jest.Mock).mockResolvedValue(latest);
    (getAvailableScanResultSummaries as jest.Mock).mockResolvedValue([
      {
        scanId: 'scan-1',
        createdAt: latest.createdAt,
        sourceName: 'latest',
        measurementPointCount: 0,
      },
      {
        scanId: 'scan-2',
        createdAt: scanTwo.createdAt,
        sourceName: 'scan two',
        measurementPointCount: 0,
      },
    ]);
    (getScanResult as jest.Mock).mockResolvedValue(scanTwo);
    (exportScanResult as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loads latest result and summaries on mount', async () => {
    const { result } = renderHook(() => useResultsData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingScanList).toBe(false);
    });

    expect(result.current.scanResult?.scanId).toBe('scan-1');
    expect(result.current.scanSummaries).toHaveLength(2);
    expect(result.current.selectedScanId).toBe('scan-1');
  });

  test('loads selected scan when requested', async () => {
    const { result } = renderHook(() => useResultsData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSelectedScanId('scan-2');
    });

    await act(async () => {
      await result.current.loadSelectedScan();
    });

    expect(getScanResult).toHaveBeenCalledWith('scan-2');
    expect(result.current.scanResult?.scanId).toBe('scan-2');
  });

  test('handles selected scan load failure', async () => {
    (getScanResult as jest.Mock).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useResultsData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSelectedScanId('scan-2');
    });

    await act(async () => {
      await result.current.loadSelectedScan();
    });

    expect(result.current.errorMessage).toBe('Failed to load scan scan-2.');
  });

  test('exports current scan and toggles download state', async () => {
    const { result } = renderHook(() => useResultsData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.downloadCurrentScan('json');
    });

    expect(exportScanResult).toHaveBeenCalledWith('scan-1', 'json');
    expect(result.current.isDownloading).toBe(false);
  });

  test('shows export error when download fails', async () => {
    (exportScanResult as jest.Mock).mockRejectedValue(new Error('export failed'));
    const { result } = renderHook(() => useResultsData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.downloadCurrentScan('csv');
    });

    expect(result.current.errorMessage).toBe('Failed to export scan result.');
    expect(result.current.isDownloading).toBe(false);
  });

  test('handles latest result load failure', async () => {
    (getLatestScanResult as jest.Mock).mockRejectedValue(new Error('latest failed'));

    const { result } = renderHook(() => useResultsData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.scanResult).toBeNull();
    expect(result.current.errorMessage).toBe('Failed to load the latest scan result.');
  });
});
