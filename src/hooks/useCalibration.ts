import { useState, useCallback } from 'react';
import { calibrationStart, calibrationCapture } from '../services/apiCalls';

export interface CalibrationPoint {
  pixelX: number;
  pixelY: number;
  gridRow?: number | null;
  gridCol?: number | null;
  step?: number | null;
  label?: string | null;
}

export interface CalibrationState {
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  totalSteps: number;
  checkerboardVisible: boolean;
  calibrated: boolean;
  lastCalibratedAt: string | null;
  referenceImage: string | null;
  targetPoint: CalibrationPoint | null;
  capturedPoints: CalibrationPoint[];
  message: string;
  isInProgress: boolean;
}

const initialState: CalibrationState = {
  isLoading: false,
  error: null,
  currentStep: 0,
  totalSteps: 4,
  checkerboardVisible: false,
  calibrated: false,
  lastCalibratedAt: null,
  referenceImage: null,
  targetPoint: null,
  capturedPoints: [],
  message: 'Ready to start calibration',
  isInProgress: false,
};

export function useCalibration() {
  const [state, setState] = useState<CalibrationState>(initialState);

  const startCalibration = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await calibrationStart();

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Failed to start calibration',
          message: response.message,
          checkerboardVisible: response.checkerboardVisible,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isInProgress: true,
        currentStep: response.currentStep,
        totalSteps: response.totalSteps,
        checkerboardVisible: response.checkerboardVisible,
        referenceImage: response.referenceImageBase64 || null,
        targetPoint: response.targetPoint || null,
        capturedPoints: response.capturedPoints || [],
        message: response.message,
        calibrated: false,
      }));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unknown error during calibration start';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
        message: errorMsg,
      }));
    }
  }, []);

  const capturePoint = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await calibrationCapture();

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Failed to capture point',
          message: response.message,
        }));
        return;
      }

      const isComplete =
        response.calibrated && !response.targetPoint && response.currentStep >= response.totalSteps;

      setState((prev) => ({
        ...prev,
        isLoading: false,
        currentStep: response.currentStep,
        totalSteps: response.totalSteps,
        checkerboardVisible: response.checkerboardVisible,
        targetPoint: response.targetPoint || null,
        capturedPoints: response.capturedPoints || [],
        message: response.message,
        calibrated: isComplete,
        lastCalibratedAt: response.lastCalibratedAt || null,
        isInProgress: !isComplete,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error during capture';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
        message: errorMsg,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    startCalibration,
    capturePoint,
    reset,
  };
}
