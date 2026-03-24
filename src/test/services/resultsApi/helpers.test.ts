import {
  normalizeAxisByBounds,
  normalizeJobSummary,
  normalizeJobToResult,
  toMeasurementValue,
} from '../../../services/resultsApi/helpers';
import { getJobImageUrl, type MeasurementApiResponse } from '../../../services/apiCalls';
import { JobApiResponse } from '../../../services/apiCalls';

jest.mock('../../../services/apiCalls');
const getJobImageUrlMocked = getJobImageUrl as jest.MockedFunction<typeof getJobImageUrl>;

describe('resultsApiHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).URL.createObjectURL = jest.fn(() => 'object-url');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('normalizeAxisByBounds clamps and normalizes values', () => {
    expect(normalizeAxisByBounds(5, 10)).toBe(0.5);
    expect(normalizeAxisByBounds(-2, 10)).toBe(0);
    expect(normalizeAxisByBounds(15, 10)).toBe(1);
    expect(normalizeAxisByBounds(5, 0)).toBe(0);
    expect(normalizeAxisByBounds(Number.NaN, 10)).toBe(0);
  });

  test('toMeasurementValue selects first numeric candidate', () => {
    expect(toMeasurementValue({ measuredValue: 3 })).toBe(3);
    expect(toMeasurementValue({ measuredValue: 'x', value: 4 })).toBe(4);
    expect(toMeasurementValue({ intensity: 5 })).toBe(5);
    expect(toMeasurementValue({})).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(toMeasurementValue(null as any)).toBe(0);
  });

  test('normalizeJobSummary builds summary with createdAt set to now', () => {
    const fixedNow = new Date('2026-03-24T15:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedNow);
    const summary = normalizeJobSummary({
      id: 'job-1',
      options: { profile: 'Profile A' },
      measurements: [{}, {}] as MeasurementApiResponse[],
    } as JobApiResponse);

    expect(summary).toEqual({
      scanId: 'job-1',
      createdAt: fixedNow.toISOString(),
      sourceName: 'Profile A',
      measurementPointCount: 2,
    });
  });

  test('normalizeJobToResult maps measurements and fetches preview image', async () => {
    const fixedNow = new Date('2026-03-24T16:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedNow);

    getJobImageUrlMocked.mockReturnValue('http://example/job/image');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['data'])),
    });

    const job: JobApiResponse = {
      id: 'job-abc',
      options: { profile: 'P' },
      measurements: [
        {
          pixelX: 5,
          pixelY: 10,
          waypointIndex: 2,
          scanResult: { value: 7 },
          simulated: true,
          timestamp: 't1',
          waypoint: { x: 1, y: 1 },
        },
        {
          pixelX: 0,
          pixelY: 0,
          scanResult: { measuredValue: 1 },
          waypointIndex: 1,
          timestamp: 't2',
          waypoint: { x: 0, y: 0 },
        },
      ],
    };

    const result = await normalizeJobToResult(job);

    expect(getJobImageUrlMocked).toHaveBeenCalledWith('job-abc');
    expect(global.fetch).toHaveBeenCalledWith('http://example/job/image');
    expect(result.scanId).toBe('job-abc');
    expect(result.createdAt).toBe(fixedNow.toISOString());
    expect(result.previewImageUrl).toBe('object-url');
    expect(result.measurementPoints).toHaveLength(2);
    expect(result.measurementPoints[0]).toMatchObject({
      waypointIndex: 2,
      measuredValue: 7,
      comment: 'Simulated',
    });
    expect(result.routePath).toEqual([
      { x: 1, y: 1 },
      { x: 0, y: 0 },
    ]);
  });
});
