import {
  normalizeAxisByBounds,
  normalizeJobSummary,
  normalizeJobToResult,
  readImageDimensionsFromBlob,
  toMeasurementValue,
} from '../../../services/resultsApi/helpers';
import { getJobImageUrl, type MeasurementApiResponse } from '../../../services/apiCalls';
import { JobApiResponse } from '../../../services/apiCalls';

jest.mock('../../../services/apiCalls');
const getJobImageUrlMocked = getJobImageUrl as jest.MockedFunction<typeof getJobImageUrl>;

function makeJpegBytes(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
    0xff,
    0xd9,
  ]);
}

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

  test('toMeasurementValue reads evaluation intensity fields and top arrays', () => {
    expect(toMeasurementValue({ evaluation: { intensityTopAverage: 3 } })).toBe(3);
    expect(toMeasurementValue({ evaluation: { intensity_average: 4 } })).toBe(4);
    expect(toMeasurementValue({ evaluation: { intensityTop: [10, 20, 30] } })).toBe(20);
    expect(
      toMeasurementValue({
        body: {
          measurementData: {
            intensityTop: [40, 10, 20],
          },
        },
      }),
    ).toBeCloseTo((40 + 20 + 10) / 3, 6);
    expect(toMeasurementValue({ measuredValue: 9 })).toBe(0);
    expect(toMeasurementValue({ value: 4 })).toBe(0);
    expect(toMeasurementValue({ intensity: 5 })).toBe(0);
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
          scanResult: { evaluation: { intensity_average: 7 } },
          simulated: true,
          timestamp: 't1',
          waypoint: { x: 1, y: 1 },
        },
        {
          pixelX: 0,
          pixelY: 0,
          scanResult: { evaluation: { intensity_average: 1 } },
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
      rawScanResult: { evaluation: { intensity_average: 7 } },
      comment: 'Simulated',
    });
    expect(result.routePath).toHaveLength(2);
    expect(result.routePath[0].x).toBeCloseTo(5 / 1280, 6);
    expect(result.routePath[0].y).toBeCloseTo(10 / 720, 6);
    expect(result.routePath[1]).toEqual({ x: 0, y: 0 });
  });

  test('normalizeJobToResult uses stored image dimensions for pixel normalization', async () => {
    getJobImageUrlMocked.mockReturnValue('http://example/job/image');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob([makeJpegBytes(1920, 1080)])),
    });

    const result = await normalizeJobToResult({
      id: 'job-hires',
      measurements: [
        {
          pixelX: 960,
          pixelY: 540,
          waypointIndex: 0,
          waypoint: { x: 0, y: 0 },
        },
      ],
    } as JobApiResponse);

    expect(result.imageWidth).toBe(1920);
    expect(result.imageHeight).toBe(1080);
    expect(result.measurementPoints[0].x).toBeCloseTo(0.5, 6);
    expect(result.measurementPoints[0].y).toBeCloseTo(0.5, 6);
  });

  test('readImageDimensionsFromBlob parses JPEG dimensions', async () => {
    await expect(
      readImageDimensionsFromBlob(new Blob([makeJpegBytes(1600, 1200)])),
    ).resolves.toEqual({
      width: 1600,
      height: 1200,
    });
  });
});
