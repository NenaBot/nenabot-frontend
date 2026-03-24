import { exportScanResult } from '../../../services/resultsApi/exportScanResult';
import { downloadContent } from '../../../services/resultsApi/helpers';
import { getScanResult } from '../../../services/resultsApi';

jest.mock('../../../services/resultsApi/helpers', () => ({
  downloadContent: jest.fn(),
  fetchJobImageObjectUrl: jest.fn(),
  normalizeAxisByBounds: jest.fn(),
  normalizeJobSummary: jest.fn(),
  normalizeJobToResult: jest.fn(),
  toMeasurementValue: jest.fn(),
}));
jest.mock('../../../services/resultsApi');
const downloadContentMocked = downloadContent as jest.MockedFunction<typeof downloadContent>;
const getScanResultMocked = getScanResult as jest.MockedFunction<typeof getScanResult>;

describe('exportScanResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exports JSON using getScanResult result', async () => {
    getScanResultMocked.mockResolvedValueOnce({
      scanId: 'scan-1',
      createdAt: 'now',
      sourceName: 'source',
      previewImageUrl: null,
      routePath: [],
      measurementPoints: [],
    });

    await exportScanResult('scan-1', 'json');

    expect(getScanResultMocked).toHaveBeenCalledWith('scan-1');
    expect(downloadContentMocked).toHaveBeenCalledWith('scan-1', 'json', expect.any(String));
    const jsonPayload = JSON.parse(downloadContentMocked.mock.calls[0][2] as string);
    expect(jsonPayload).toMatchObject({ scanId: 'scan-1', measurementPoints: [] });
  });

  test('exports CSV with header and rows', async () => {
    getScanResultMocked.mockResolvedValueOnce({
      scanId: 'scan-2',
      createdAt: 'now',
      sourceName: 'source',
      previewImageUrl: null,
      routePath: [],
      measurementPoints: [
        {
          id: 'id-1',
          label: 'P-001',
          x: 0.1,
          y: 0.2,
          waypointIndex: 1,
          measuredValue: 2.5,
          comment: 'note',
          timestamp: 't',
        },
      ],
    });

    await exportScanResult('scan-2', 'csv');

    expect(getScanResultMocked).toHaveBeenCalledWith('scan-2');
    expect(downloadContentMocked).toHaveBeenCalledWith('scan-2', 'csv', expect.any(String));
    const csv = downloadContentMocked.mock.calls[0][2] as string;
    const [header, row] = csv.split('\n');
    expect(header).toBe('id,label,x,y,waypointIndex,measuredValue,comment,timestamp');
    expect(row).toBe('id-1,P-001,0.1,0.2,1,2.5,note,t');
  });
});
