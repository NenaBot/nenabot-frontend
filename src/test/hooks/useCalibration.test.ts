import { act, renderHook } from '@testing-library/react';
import { useCalibration } from '../../hooks/useCalibration';

jest.mock('../../services/apiCalls', () => ({
  calibrationStart: jest.fn(),
  calibrationCapture: jest.fn(),
}));

const { calibrationStart, calibrationCapture } = jest.requireMock('../../services/apiCalls') as {
  calibrationStart: jest.Mock;
  calibrationCapture: jest.Mock;
};

describe('useCalibration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('keeps a new calibration session open when an old mapping makes capture report calibrated', async () => {
    calibrationStart.mockResolvedValue({
      ok: true,
      message: 'Calibration started',
      currentStep: 0,
      totalSteps: 4,
      checkerboardVisible: true,
      calibrated: true,
      lastCalibratedAt: '2026-04-01T10:00:00+00:00',
      referenceImageBase64: 'encoded-image',
      targetPoint: { pixelX: 100, pixelY: 100, step: 1, label: 'P1' },
      capturedPoints: [],
    });
    calibrationCapture.mockResolvedValue({
      ok: true,
      message: 'Captured point 1/4',
      currentStep: 1,
      totalSteps: 4,
      checkerboardVisible: true,
      calibrated: true,
      lastCalibratedAt: '2026-04-01T10:00:00+00:00',
      targetPoint: { pixelX: 200, pixelY: 100, step: 2, label: 'P2' },
      capturedPoints: [{ pixelX: 100, pixelY: 100, step: 1, label: 'P1' }],
    });

    const { result } = renderHook(() => useCalibration());

    await act(async () => {
      await result.current.startCalibration();
    });
    await act(async () => {
      await result.current.capturePoint();
    });

    expect(result.current.isInProgress).toBe(true);
    expect(result.current.calibrated).toBe(false);
    expect(result.current.targetPoint?.step).toBe(2);
    expect(result.current.referenceImage).toBe('encoded-image');
  });

  test('marks calibration complete only after the final response has no next target', async () => {
    calibrationCapture.mockResolvedValue({
      ok: true,
      message: 'Calibration completed',
      currentStep: 4,
      totalSteps: 4,
      checkerboardVisible: true,
      calibrated: true,
      lastCalibratedAt: '2026-04-24T10:00:00+00:00',
      targetPoint: null,
      capturedPoints: [
        { pixelX: 100, pixelY: 100, step: 1, label: 'P1' },
        { pixelX: 200, pixelY: 100, step: 2, label: 'P2' },
        { pixelX: 200, pixelY: 200, step: 3, label: 'P3' },
        { pixelX: 100, pixelY: 200, step: 4, label: 'P4' },
      ],
    });

    const { result } = renderHook(() => useCalibration());

    await act(async () => {
      await result.current.capturePoint();
    });

    expect(result.current.isInProgress).toBe(false);
    expect(result.current.calibrated).toBe(true);
    expect(result.current.lastCalibratedAt).toBe('2026-04-24T10:00:00+00:00');
  });
});
