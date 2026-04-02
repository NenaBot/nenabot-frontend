import { act, renderHook, waitFor } from '@testing-library/react';
import { useRoutePlan } from '../../hooks/useRoutePlan';
import { createJob, detectPath, populatePath } from '../../services/apiCalls';
import { isMockModeEnabled } from '../../state/mockMode';
import { ProfileModel } from '../../types/profile.types';

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
    options: {
      speed: 'slow',
      measurementDensity: 0.7,
    },
  },
};

describe('useRoutePlan', () => {
  beforeEach(() => {
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
              { x: 5, y: 15 },
              { x: 15, y: 15 },
              { x: 15, y: 25 },
              { x: 5, y: 25 },
            ],
          },
          {
            corners: [
              { x: 25, y: 35 },
              { x: 35, y: 35 },
              { x: 35, y: 45 },
              { x: 25, y: 45 },
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

  test('re-populates when a corner point is moved', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.moveCornerPoint('battery-0-corner-0', 0.5, 0.5);
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
              { x: 0.5, y: 0.5 },
              { x: 15, y: 15 },
              { x: 15, y: 25 },
              { x: 5, y: 25 },
            ],
          },
          {
            corners: [
              { x: 25, y: 35 },
              { x: 35, y: 35 },
              { x: 35, y: 45 },
              { x: 25, y: 45 },
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

  test('returns null when creating a job without profile/path', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile: null }));

    const jobId = await act(async () => result.current.createScanJob());

    expect(jobId).toBeNull();
    expect(createJob).not.toHaveBeenCalled();
  });
});
