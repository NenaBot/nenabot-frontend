import { act, renderHook, waitFor } from '@testing-library/react';
import { useRoutePlan } from '../../hooks/useRoutePlan';
import { checkPath, createJob, detectPath } from '../../services/apiCalls';
import { isMockModeEnabled } from '../../state/mockMode';
import { ProfileModel } from '../../types/profile.types';

jest.mock('../../services/apiCalls', () => ({
  detectPath: jest.fn(),
  checkPath: jest.fn(),
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
    options: { speed: 'slow' },
  },
};

describe('useRoutePlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (isMockModeEnabled as jest.Mock).mockReturnValue(false);
  });

  test('detects and checks path successfully', async () => {
    (detectPath as jest.Mock).mockResolvedValue({
      ok: true,
      detections: [
        { center_x: 10, center_y: 20 },
        { center_x: 30, center_y: 40 },
      ],
      image_base64: 'abc123',
    });
    (checkPath as jest.Mock).mockResolvedValue({
      waypoints: [
        { x: 12, y: 22 },
        { x: 32, y: 42 },
      ],
    });

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await act(async () => {
      await result.current.detectAndCheckPath();
    });

    await waitFor(() => {
      expect(result.current.state.isDetecting).toBe(false);
      expect(result.current.state.isChecking).toBe(false);
    });

    expect(detectPath).toHaveBeenCalledWith({ options: { speed: 'slow' } });
    expect(checkPath).toHaveBeenCalledWith([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
    expect(result.current.state.checkedWaypoints).toEqual([
      { x: 12, y: 22 },
      { x: 32, y: 42 },
    ]);
    expect(result.current.state.imageBase64).toBe('abc123');
    expect(result.current.preview.waypoints.length).toBe(2);
  });

  test('sets user-facing error when no points are detected', async () => {
    (detectPath as jest.Mock).mockResolvedValue({
      ok: true,
      detections: [],
      image_base64: null,
    });

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await act(async () => {
      await result.current.detectAndCheckPath();
    });

    expect(checkPath).not.toHaveBeenCalled();
    expect(result.current.state.detectError).toBe('Failed to detect/check path. Please retry.');
    expect(result.current.state.isDetecting).toBe(false);
    expect(result.current.state.isChecking).toBe(false);
  });

  test('returns null when creating a job without checked waypoints', async () => {
    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    const jobId = await act(async () => result.current.createScanJob());

    expect(jobId).toBeNull();
    expect(createJob).not.toHaveBeenCalled();
  });

  test('creates a scan job with profile settings and dryRun', async () => {
    (detectPath as jest.Mock).mockResolvedValue({
      ok: true,
      detections: [{ center_x: 10, center_y: 20 }],
      image_base64: 'image-data',
    });
    (checkPath as jest.Mock).mockResolvedValue({
      waypoints: [{ x: 10, y: 20 }],
    });
    (createJob as jest.Mock).mockResolvedValue({ id: 'job-123' });

    const { result } = renderHook(() => useRoutePlan({ selectedProfile }));

    await act(async () => {
      await result.current.detectAndCheckPath();
    });

    act(() => {
      result.current.setDryRun(true);
    });

    const jobId = await act(async () => result.current.createScanJob());

    expect(jobId).toBe('job-123');
    expect(createJob).toHaveBeenCalledWith({
      path: [{ x: 10, y: 20 }],
      workZ: 10,
      workR: 20,
      dryRun: true,
      options: {
        profile: 'default-profile',
        speed: 'slow',
      },
      imageBase64: 'image-data',
    });
  });
});
