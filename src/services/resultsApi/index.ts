import { fetchJobById, fetchJobs, fetchLatestJob } from '../apiCalls';
import {
  getMockLatestScanResult,
  getMockScanResultById,
  getMockScanResultSummaries,
} from '../../mocks/scanResultsMocks';
import { ScanResult, ScanResultSummary } from '../../types/results.types';
import { isMockModeEnabled } from '../../state/mockMode';
import { normalizeJobSummary, normalizeJobToResult } from './helpers';

export async function getAvailableScanResultSummaries(): Promise<ScanResultSummary[]> {
  if (isMockModeEnabled()) {
    return getMockScanResultSummaries();
  }

  const response = await fetchJobs();
  return response.map(normalizeJobSummary);
}

export async function getLatestScanResult(): Promise<ScanResult> {
  if (isMockModeEnabled()) {
    return getMockLatestScanResult();
  }

  const response = await fetchLatestJob();
  return normalizeJobToResult(response);
}

export async function getScanResult(scanId: string): Promise<ScanResult> {
  if (isMockModeEnabled()) {
    return getMockScanResultById(scanId);
  }

  const response = await fetchJobById(scanId);
  return normalizeJobToResult(response);
}
