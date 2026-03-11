import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, RefreshCcw } from 'lucide-react';
import { RoutePreviewPanel } from '../shared/RoutePreviewPanel';
import {
  exportScanResult,
  getAvailableScanResultSummaries,
  getLatestScanResult,
  getScanResult,
} from './results/results.api';
import { MeasurementPointDetailsCard } from './results/MeasurementPointDetailsCard';
import { MeasurementPointsTable } from './results/MeasurementPointsTable';
import { ThresholdSettingsCard } from './results/ThresholdSettingsCard';
import {
  formatDateTime,
  isCriticalMeasurement,
  ScanResult,
  ScanResultSummary,
} from './results/results.model';

type ExportFormat = 'json' | 'csv';

function getFirstPointId(result: ScanResult | null): string | null {
  if (!result || result.measurementPoints.length === 0) {
    return null;
  }

  return result.measurementPoints[0].id;
}

export function ResultsTab() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanSummaries, setScanSummaries] = useState<ScanResultSummary[]>([]);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingScanList, setIsLoadingScanList] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [criticalThreshold, setCriticalThreshold] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const criticalPointIds = useMemo(() => {
    if (!scanResult) {
      return [];
    }

    return scanResult.measurementPoints
      .filter((point) => isCriticalMeasurement(point, criticalThreshold))
      .map((point) => point.id);
  }, [criticalThreshold, scanResult]);

  const selectedPoint = useMemo(() => {
    if (!scanResult || !selectedPointId) {
      return null;
    }

    return scanResult.measurementPoints.find((point) => point.id === selectedPointId) ?? null;
  }, [scanResult, selectedPointId]);

  const selectedPointIndex = useMemo(() => {
    if (!scanResult || !selectedPointId) {
      return -1;
    }

    return scanResult.measurementPoints.findIndex((point) => point.id === selectedPointId);
  }, [scanResult, selectedPointId]);

  const hasPreviousPoint = selectedPointIndex > 0;
  const hasNextPoint =
    scanResult !== null &&
    selectedPointIndex >= 0 &&
    selectedPointIndex < scanResult.measurementPoints.length - 1;

  const handleSelectPreviousPoint = () => {
    if (!scanResult || !hasPreviousPoint) {
      return;
    }

    const previousPoint = scanResult.measurementPoints[selectedPointIndex - 1];
    setSelectedPointId(previousPoint.id);
  };

  const handleSelectNextPoint = () => {
    if (!scanResult || !hasNextPoint) {
      return;
    }

    const nextPoint = scanResult.measurementPoints[selectedPointIndex + 1];
    setSelectedPointId(nextPoint.id);
  };

  const loadLatestResult = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const latestResult = await getLatestScanResult();
      setScanResult(latestResult);
      setSelectedPointId(getFirstPointId(latestResult));
      setSelectedScanId(latestResult.scanId);
    } catch (error) {
      console.error('Failed to load latest scan result:', error);
      setErrorMessage('Failed to load the latest scan result.');
      setScanResult(null);
      setSelectedPointId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScanSummaries = async () => {
    setIsLoadingScanList(true);

    try {
      const summaries = await getAvailableScanResultSummaries();
      setScanSummaries(summaries);
    } catch (error) {
      console.error('Failed to load available scan results:', error);
      setScanSummaries([]);
    } finally {
      setIsLoadingScanList(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadLatestResult(), loadScanSummaries()]);
  }, []);

  const handleLoadSelectedScan = async () => {
    if (selectedScanId.trim().length === 0) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loadedResult = await getScanResult(selectedScanId);
      setScanResult(loadedResult);
      setSelectedPointId(getFirstPointId(loadedResult));
    } catch (error) {
      console.error('Failed to load selected scan result:', error);
      setErrorMessage(`Failed to load scan ${selectedScanId}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!scanResult) {
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);

    try {
      await exportScanResult(scanResult.scanId, exportFormat);
    } catch (error) {
      console.error('Failed to export scan result:', error);
      setErrorMessage('Failed to export scan result.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl mb-1">Scan Results</h2>
          {scanResult && (
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {scanResult.sourceName} - {formatDateTime(scanResult.createdAt)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedScanId}
            onChange={(event) => setSelectedScanId(event.target.value)}
            className="px-3 py-2 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm"
            disabled={isLoadingScanList}
            title="View uploaded data from a previous scan"
          >
            {scanSummaries.length === 0 ? (
              <option value="">No previous scans</option>
            ) : (
              scanSummaries.map((summary) => (
                <option key={summary.scanId} value={summary.scanId}>
                  {summary.sourceName} ({summary.measurementPointCount} points)
                </option>
              ))
            )}
          </select>

          <button
            className="px-4 py-2 border border-[var(--md-sys-color-outline)] rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-sm"
            onClick={handleLoadSelectedScan}
            disabled={isLoading || selectedScanId.trim().length === 0}
          >
            Load Scan
          </button>

          <button
            className="px-3 py-2 border border-[var(--md-sys-color-outline)] rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
            onClick={() => {
              void Promise.all([loadLatestResult(), loadScanSummaries()]);
            }}
            disabled={isLoading || isLoadingScanList}
            title="Refresh result data"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>

          <select
            value={exportFormat}
            onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
            className="px-3 py-2 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>

          <button
            className="px-4 py-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-lg hover:shadow-md transition-all text-sm flex items-center gap-2 disabled:opacity-60"
            onClick={handleDownload}
            disabled={!scanResult || isDownloading}
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 border border-red-400 text-red-800 rounded-lg bg-red-50 text-sm">
          {errorMessage}
        </div>
      )}

      {!isLoading && !scanResult && (
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-12 bg-[var(--md-sys-color-surface-container-lowest)] text-center">
          <div className="w-20 h-20 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-[var(--md-sys-color-on-primary-container)]" />
          </div>
          <h3 className="text-xl mb-2">No scan result loaded</h3>
        </div>
      )}

      {scanResult && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <ThresholdSettingsCard
                threshold={criticalThreshold}
                criticalCount={criticalPointIds.length}
                totalCount={scanResult.measurementPoints.length}
                onThresholdChange={setCriticalThreshold}
              />

              <MeasurementPointDetailsCard
                point={selectedPoint}
                criticalThreshold={criticalThreshold}
                hasPrevious={hasPreviousPoint}
                hasNext={hasNextPoint}
                onPrevious={handleSelectPreviousPoint}
                onNext={handleSelectNextPoint}
              />
            </div>

            <div className="lg:col-span-2">
              <RoutePreviewPanel
                title="Scan Path and Measurements"
                imageUrl={scanResult.previewImageUrl}
                routePath={scanResult.routePath}
                criticalPointIds={criticalPointIds}
                measurementPoints={scanResult.measurementPoints.map((point) => ({
                  id: point.id,
                  label: point.label,
                  x: point.x,
                  y: point.y,
                }))}
                selectedPointId={selectedPointId}
                onSelectPoint={setSelectedPointId}
              />
            </div>
          </div>

          <MeasurementPointsTable
            points={scanResult.measurementPoints}
            criticalThreshold={criticalThreshold}
            selectedPointId={selectedPointId}
            onSelectPoint={setSelectedPointId}
          />
        </>
      )}
    </div>
  );
}
