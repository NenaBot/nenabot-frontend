import { ScanResult, ScanResultSummary } from '../components/tabs/results/results.model';

const MOCK_SCAN_IDS = ['mock-scan-latest', 'mock-scan-02', 'mock-scan-03'];

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function createSerpentinePath(columns: number, rows: number): { x: number; y: number }[] {
  const routePath: { x: number; y: number }[] = [];

  for (let row = 0; row < rows; row += 1) {
    const normalizedY = rows === 1 ? 0.5 : row / (rows - 1);
    const leftToRight = row % 2 === 0;
    const start = leftToRight ? 0 : columns - 1;
    const end = leftToRight ? columns : -1;
    const step = leftToRight ? 1 : -1;

    for (let col = start; col !== end; col += step) {
      const normalizedX = columns === 1 ? 0.5 : col / (columns - 1);
      routePath.push({ x: normalizedX, y: normalizedY });
    }
  }

  return routePath;
}

function createMockScanResult(
  scanId: string,
  sourceName: string,
  offsetMinutes: number,
): ScanResult {
  const rows = 10;
  const columns = 12;
  const routePath = createSerpentinePath(columns, rows);
  const now = Date.now() - offsetMinutes * 60_000;

  const measurementPoints = routePath.map((point, index) => {
    const measuredValue = round(
      0.58 + ((index % 23) / 22) * 0.62 + (index % 7 === 0 ? 0.22 : 0),
      3,
    );

    return {
      id: `${scanId}-m-${index + 1}`,
      label: `P-${(index + 1).toString().padStart(3, '0')}`,
      x: point.x,
      y: point.y,
      waypointIndex: index + 1,
      measuredValue,
      comment:
        measuredValue > 1.1
          ? 'Potential thermal anomaly'
          : measuredValue > 0.95
            ? 'Elevated reading'
            : 'Within expected range',
      timestamp: new Date(now + index * 9_000).toISOString(),
    };
  });

  return {
    scanId,
    createdAt: new Date(now).toISOString(),
    sourceName,
    previewImageUrl: null,
    routePath,
    measurementPoints,
  };
}

const MOCK_SCAN_RESULTS: ScanResult[] = [
  createMockScanResult(MOCK_SCAN_IDS[0], 'Mock Latest Scan', 0),
  createMockScanResult(MOCK_SCAN_IDS[1], 'Mock Uploaded Scan A', 90),
  createMockScanResult(MOCK_SCAN_IDS[2], 'Mock Uploaded Scan B', 220),
];

export function getMockScanResultSummaries(): ScanResultSummary[] {
  return MOCK_SCAN_RESULTS.map((scan) => ({
    scanId: scan.scanId,
    createdAt: scan.createdAt,
    sourceName: scan.sourceName,
    measurementPointCount: scan.measurementPoints.length,
  }));
}

export function getMockLatestScanResult(): ScanResult {
  return MOCK_SCAN_RESULTS[0];
}

export function getMockScanResultById(scanId: string): ScanResult {
  return MOCK_SCAN_RESULTS.find((scan) => scan.scanId === scanId) ?? MOCK_SCAN_RESULTS[0];
}
