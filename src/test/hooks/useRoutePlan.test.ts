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
        { center_x: 10, center_y: 20 },
        { center_x: 30, center_y: 40 },
      ],
      image_base64: 'abc123',
    });
    (populatePath as jest.Mock).mockResolvedValue({
      path: [
        { x: 10, y: 20, type: 'corner' },
        { x: 20, y: 30, type: 'measurement' },
        { x: 30, y: 40, type: 'corner' },
      ],
    });
  });

  test('detects route points and populates path on mount', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await waitFor(() => {
      expect(detectPath).toHaveBeenCalledWith({ options: selectedProfile.settings.options });
      expect(populatePath).toHaveBeenCalledWith({
        corners: [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ],
        measurementDensity: 0.7,
        detections: [
          { center_x: 10, center_y: 20 },
          { center_x: 30, center_y: 40 },
        ],
        options: selectedProfile.settings.options,
      });
    });

    expect(result.current.state.measurementPoints).toEqual([{ x: 20, y: 30 }]);
    expect(result.current.state.cornerPoints).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
    expect(result.current.state.imageBase64).toBe('abc123');
    expect(result.current.preview.cornerPointIds.length).toBe(2);
    expect(result.current.preview.points.length).toBe(3);
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
          measurementDensity: 1.1,
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
      result.current.moveCornerPoint('corner-1', 0.5, 0.5);
    });

    await waitFor(() => {
      expect(populatePath).toHaveBeenCalledTimes(2);
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
    expect(createJob).toHaveBeenCalledWith({
      path: [
        { x: 10, y: 20 },
        { x: 20, y: 30 },
        { x: 30, y: 40 },
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
