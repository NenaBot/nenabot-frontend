import { act, renderHook, waitFor } from '@testing-library/react';
import { useRoutePlan } from '../../hooks/useRoutePlan';
import { createJob, detectPath, populatePath } from '../../services/apiCalls';
import { isMockModeEnabled } from '../../state/mockMode';
import { ProfileModel } from '../../types/profile.types';
import { MEASUREMENT_DENSITY_MAX } from '../../types/route.types';

jest.mock('../../services/apiCalls', () => ({
  detectPath: jest.fn(),
  populatePath: jest.fn(),
  createJob: jest.fn(),
}));

jest.mock('../../state/mockMode', () => ({
  isMockModeEnabled: jest.fn(),
}));

const selectedProfile: ProfileModel = {
  name: 'default-profile',
  description: 'test profile',
  settings: {
    workZ: 10,
    workR: 20,
    threshold: 120,
    options: {
      speed: 'slow',
      measurementDensity: 0.7,
    },
  },
};

/**
 * Stub Image that immediately triggers onerror so resolveImageDimensions does not
 * block on the 3-second timeout in test environments where jsdom cannot load images.
 */
class FakeImage {
  onload: ((e: Event) => void) | null = null;
  onerror: ((e: Event | string) => void) | null = null;
  set src(_value: string) {
    this.onerror?.(new Event('error'));
  }
}

describe('useRoutePlan', () => {
  let OriginalImage: typeof Image;

  beforeEach(() => {
    OriginalImage = global.Image;
    Object.defineProperty(global, 'Image', {
      value: FakeImage,
      writable: true,
      configurable: true,
    });
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (isMockModeEnabled as jest.Mock).mockReturnValue(false);
    (detectPath as jest.Mock).mockResolvedValue({
      ok: true,
      detections: [
        {
          center_x: 10,
          center_y: 20,
          corners: [
            { x: 5, y: 15 },
            { x: 15, y: 15 },
            { x: 15, y: 25 },
            { x: 5, y: 25 },
          ],
        },
        {
          center_x: 30,
          center_y: 40,
          corners: [
            { x: 25, y: 35 },
            { x: 35, y: 35 },
            { x: 35, y: 45 },
            { x: 25, y: 45 },
          ],
        },
      ],
      image_base64: 'abc123',
    });
    // Mock response from backend with full metadata
    (populatePath as jest.Mock).mockResolvedValue({
      path: [
        { index: '0', batteryNr: 0, cornerIndex: 0, measurementIndex: 0, pixelX: 5, pixelY: 15 },
        { index: '1', batteryNr: 0, cornerIndex: 0, measurementIndex: 1, pixelX: 20, pixelY: 30 },
        { index: '2', batteryNr: 1, cornerIndex: 0, measurementIndex: 2, pixelX: 25, pixelY: 35 },
      ],
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'Image', {
      value: OriginalImage,
      writable: true,
      configurable: true,
    });
  });

  test('detects route points and populates path on mount', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(detectPath).toHaveBeenCalledWith({ options: selectedProfile.settings.options });
    });

    // Verify populatePath was called with batteries format
    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledWith({
        batteries: [
          {
            corners: [
              { pixelX: 5, pixelY: 15 },
              { pixelX: 15, pixelY: 15 },
              { pixelX: 15, pixelY: 25 },
              { pixelX: 5, pixelY: 25 },
            ],
          },
          {
            corners: [
              { pixelX: 25, pixelY: 35 },
              { pixelX: 35, pixelY: 35 },
              { pixelX: 35, pixelY: 45 },
              { pixelX: 25, pixelY: 45 },
            ],
          },
        ],
        measuringPointsPerCm: 0.7,
        options: selectedProfile.settings.options,
      });
    });

    // Verify state includes all detected corners and populated measurements
    expect(result.current.state.cornerPoints).toEqual([
      { x: 5, y: 15 },
      { x: 15, y: 15 },
      { x: 15, y: 25 },
      { x: 5, y: 25 },
      { x: 25, y: 35 },
      { x: 35, y: 35 },
      { x: 35, y: 45 },
      { x: 25, y: 45 },
    ]);
    expect(result.current.state.measurementPoints).toEqual([{ x: 20, y: 30 }]);
    expect(result.current.state.imageBase64).toBe('abc123');
    expect(result.current.preview.cornerPointIds.length).toBe(8);
    expect(result.current.preview.points.length).toBe(9);
  });

  test('clamps profile measurement density above max before populating', async () => {
    const highDensityProfile: ProfileModel = {
      ...selectedProfile,
      settings: {
        ...selectedProfile.settings,
        options: {
          ...selectedProfile.settings.options,
          measurementDensity: 42,
        },
      },
    };

    const { result } = renderHook(() => useRoutePlan({ selectedProfile: highDensityProfile }));

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledWith(
        expect.objectContaining({
          measuringPointsPerCm: MEASUREMENT_DENSITY_MAX,
        }),
      );
    });

    expect(result.current.state.measurementDensity).toBe(MEASUREMENT_DENSITY_MAX);
  });

  test('re-populates when measurement density changes', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.setMeasurementDensity(1.1);
    });

    await waitFor(() => {
      expect(populatePath).toHaveBeenLastCalledWith(
        expect.objectContaining({
          measuringPointsPerCm: 1.1,
        }),
      );
    });
  });

  test('re-populates when a corner point is moved to edge values', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.moveCornerPoint('battery-0-corner-0', 0, 100);
    });

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledTimes(2);
    });

    expect(detectPath).toHaveBeenCalledTimes(1);
    expect(populatePath).toHaveBeenLastCalledWith(
      expect.objectContaining({
        batteries: [
          {
            corners: [
              { pixelX: 0, pixelY: 100 },
              { pixelX: 15, pixelY: 15 },
              { pixelX: 15, pixelY: 25 },
              { pixelX: 5, pixelY: 25 },
            ],
          },
          {
            corners: [
              { pixelX: 25, pixelY: 35 },
              { pixelX: 35, pixelY: 35 },
              { pixelX: 35, pixelY: 45 },
              { pixelX: 25, pixelY: 45 },
            ],
          },
        ],
      }),
    );
  });

  test('reset performs fresh detection and replaces edited batteries', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(detectPath).toHaveBeenCalledTimes(1);
      expect(populatePath).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.moveCornerPoint('battery-0-corner-0', 99, 88);
    });

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledTimes(2);
    });

    (detectPath as jest.Mock).mockResolvedValueOnce({
      ok: true,
      detections: [
        {
          center_x: 50,
          center_y: 60,
          corners: [
            { x: 45, y: 55 },
            { x: 55, y: 55 },
            { x: 55, y: 65 },
            { x: 45, y: 65 },
          ],
        },
      ],
      image_base64: 'new-image',
    });

    await act(async () => {
      await result.current.resetRoutePlan();
    });

    await waitFor(() => {
      expect(detectPath).toHaveBeenCalledTimes(2);
      expect(populatePath).toHaveBeenCalledTimes(3);
    });

    expect(result.current.state.cornerPoints).toEqual([
      { x: 45, y: 55 },
      { x: 55, y: 55 },
      { x: 55, y: 65 },
      { x: 45, y: 65 },
    ]);
    expect(result.current.state.imageBase64).toBe('new-image');
  });

  test('reset clears stale image and sets initializing state before new detection resolves', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(detectPath).toHaveBeenCalledTimes(1);
      expect(populatePath).toHaveBeenCalledTimes(1);
      expect(result.current.state.imageBase64).toBe('abc123');
    });

    type DetectionResult = {
      ok: boolean;
      detections: Array<{
        center_x: number;
        center_y: number;
        corners: Array<{ x: number; y: number }>;
      }>;
      image_base64: string;
    };

    let resolveDetection: ((value: DetectionResult) => void) | null = null;

    const pendingDetection = new Promise<DetectionResult>((resolve) => {
      resolveDetection = resolve;
    });

    (detectPath as jest.Mock).mockImplementationOnce(() => pendingDetection);

    let resetPromise: Promise<void> | null = null;
    await act(async () => {
      resetPromise = result.current.resetRoutePlan();
    });

    await waitFor(() => {
      expect(result.current.state.isInitializing).toBe(true);
      expect(result.current.state.imageBase64).toBeNull();
    });

    expect(resolveDetection).not.toBeNull();
    resolveDetection?.({
      ok: true,
      detections: [
        {
          center_x: 12,
          center_y: 22,
          corners: [
            { x: 10, y: 20 },
            { x: 14, y: 20 },
            { x: 14, y: 24 },
            { x: 10, y: 24 },
          ],
        },
      ],
      image_base64: 'fresh-image',
    });

    await act(async () => {
      await resetPromise;
    });

    await waitFor(() => {
      expect(result.current.state.isInitializing).toBe(false);
      expect(result.current.state.imageBase64).toBe('fresh-image');
    });
  });

  test('creates a scan job with populated path and dry run settings', async () => {
    (createJob as jest.Mock).mockResolvedValue({ id: 'job-123' });

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setDryRun(true);
    });

    const jobId = await act(async () => result.current.createScanJob());

    expect(jobId).toBe('job-123');
    // Job path should include metadata from backend response
    expect(createJob).toHaveBeenCalledWith({
      path: [
        { pixelX: 5, pixelY: 15, index: '0', batteryNr: 0, cornerIndex: 0, measurementIndex: 0 },
        { pixelX: 20, pixelY: 30, index: '1', batteryNr: 0, cornerIndex: 0, measurementIndex: 1 },
        { pixelX: 25, pixelY: 35, index: '2', batteryNr: 1, cornerIndex: 0, measurementIndex: 2 },
      ],
      workZ: 10,
      workR: 20,
      dryRun: true,
      options: {
        profile: 'default-profile',
        speed: 'slow',
        measurementDensity: 0.7,
      },
      imageBase64: 'abc123',
    });
  });

  test('filters invalid populated points that do not match metadata contract', async () => {
    (populatePath as jest.Mock).mockResolvedValueOnce({
      path: [
        { index: '0', batteryNr: 0, cornerIndex: 0, measurementIndex: 0, pixelX: 5, pixelY: 15 },
        {
          index: '1',
          batteryNr: 0,
          cornerIndex: 0,
          measurementIndex: 1,
          pixelX: 10,
          pixelY: 20,
        },
        // Invalid: missing batteryNr/cornerIndex/measurementIndex should be ignored.
        { index: 'bad', pixelX: 99, pixelY: 99 },
      ],
    });

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.state.populatedPathWithMetadata).toHaveLength(2);
    });

    expect(result.current.state.populatedPathWithMetadata).toHaveLength(2);
    expect(result.current.state.populatedPathWithMetadata).toEqual([
      { index: '0', batteryNr: 0, cornerIndex: 0, measurementIndex: 0, pixelX: 5, pixelY: 15 },
      { index: '1', batteryNr: 0, cornerIndex: 0, measurementIndex: 1, pixelX: 10, pixelY: 20 },
    ]);
    expect(result.current.state.populatedPath).toEqual([
      { x: 5, y: 15 },
      { x: 10, y: 20 },
    ]);
  });

  test('sets explicit error when backend returns only invalid populated path metadata', async () => {
    (populatePath as jest.Mock).mockResolvedValueOnce({
      path: [
        { index: 'bad-1', pixelX: 99, pixelY: 99 },
        { index: 'bad-2', pixelX: 100, pixelY: 100 },
      ],
    });

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.state.routeError).toBe(
        'Received invalid route metadata from backend. Please retry.',
      );
    });

    expect(result.current.state.populatedPathWithMetadata).toEqual([]);
    expect(result.current.state.populatedPath).toEqual([]);
    expect(result.current.state.routeError).toBe(
      'Received invalid route metadata from backend. Please retry.',
    );
  });

  test('sets a user-facing error when detection returns no points', async () => {
    (detectPath as jest.Mock).mockResolvedValueOnce({
      ok: true,
      detections: [],
      image_base64: null,
    });

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(result.current.state.isInitializing).toBe(false);
    });

    expect(populatePath).not.toHaveBeenCalled();
    expect(result.current.state.routeError).toBe('Failed to detect route points. Please retry.');
  });

  test('parses corners when detection uses pixelX and pixelY fields', async () => {
    (detectPath as jest.Mock).mockResolvedValueOnce({
      ok: true,
      detections: [
        {
          corners: [
            { pixelX: 101, pixelY: 201 },
            { pixelX: 111, pixelY: 201 },
            { pixelX: 111, pixelY: 211 },
            { pixelX: 101, pixelY: 211 },
          ],
        },
      ],
      image_base64: 'pixel-corners',
    });

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledWith(
        expect.objectContaining({
          batteries: [
            {
              corners: [
                { pixelX: 101, pixelY: 201 },
                { pixelX: 111, pixelY: 201 },
                { pixelX: 111, pixelY: 211 },
                { pixelX: 101, pixelY: 211 },
              ],
            },
          ],
        }),
      );
    });

    expect(result.current.state.cornerPoints).toEqual([
      { x: 101, y: 201 },
      { x: 111, y: 201 },
      { x: 111, y: 211 },
      { x: 101, y: 211 },
    ]);
    expect(result.current.state.imageBase64).toBe('pixel-corners');
  });

  test('in mock mode it initializes route without calling detectPath API', async () => {
    (isMockModeEnabled as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(result.current.state.isInitializing).toBe(false);
      expect(result.current.state.cornerPoints.length).toBeGreaterThan(0);
      expect(result.current.state.populatedPathWithMetadata.length).toBeGreaterThan(0);
    });

    expect(detectPath).not.toHaveBeenCalled();
    expect(populatePath).not.toHaveBeenCalled();
    expect(result.current.state.batteries).toHaveLength(2);
    expect(result.current.state.populatedPathWithMetadata).toHaveLength(16);
    expect(
      result.current.state.populatedPathWithMetadata
        .slice(0, 8)
        .every((point) => point.batteryNr === 0),
    ).toBe(true);
    expect(
      result.current.state.populatedPathWithMetadata
        .slice(8)
        .every((point) => point.batteryNr === 1),
    ).toBe(true);
    expect(result.current.state.cornerPoints).toEqual(
      expect.arrayContaining([
        { x: 90, y: 80 },
        { x: 250, y: 80 },
        { x: 290, y: 90 },
        { x: 430, y: 220 },
      ]),
    );
  });

  test('returns null when creating a job without profile/path', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile: null }));

    const jobId = await act(async () => result.current.createScanJob());

    expect(jobId).toBeNull();
    expect(createJob).not.toHaveBeenCalled();
  });
});
