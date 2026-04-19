import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface CalibrationState {
  intrinsicsLoaded: boolean;
  checkerboardVisible: boolean;
  calibrated: boolean;
  lastCalibratedAt: string;
  currentStep: number;
  totalSteps: number;
  targetPoint: { pixelX: number; pixelY: number; label?: string } | null;
  capturedPoints: Array<{ pixelX: number; pixelY: number; label?: string }>;
  message: string;
  referenceImageBase64?: string;
}

interface CalibrationStatusResponse {
  calibration: {
    intrinsicsLoaded: boolean;
    checkerboardVisible: boolean;
    calibrated: boolean;
    lastCalibratedAt: string;
    currentStep: number;
    totalSteps: number;
  };
}

interface CalibrationFlowResponse {
  currentStep: number;
  totalSteps: number;
  message: string;
  targetPoint?: { pixelX: number; pixelY: number; label?: string } | null;
  capturedPoints?: Array<{ pixelX: number; pixelY: number; label?: string }>;
  referenceImageBase64?: string;
}

interface CalibrationTabProps {
  isActive?: boolean;
}

export function CalibrationTab({ isActive = true }: CalibrationTabProps) {
  const [calibrationState, setCalibrationState] = useState<CalibrationState>({
    intrinsicsLoaded: false,
    checkerboardVisible: false,
    calibrated: false,
    lastCalibratedAt: 'Never',
    currentStep: 0,
    totalSteps: 4,
    targetPoint: null,
    capturedPoints: [],
    message:
      'Press Start Calibration once the checkerboard is visible and the robot is at the desired start pose.',
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const referenceImageRef = useRef<HTMLImageElement>(null);

  const setPill = (ok: boolean) => ({
    className: `inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
      ok
        ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
        : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'
    }`,
    icon: ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />,
    text: ok ? 'Ready' : 'Not Ready',
  });

  const refreshStatus = async () => {
    try {
      const data = await apiClient.get<CalibrationStatusResponse>('/api/status');
      const cal = data.calibration;
      setCalibrationState((prev) => ({
        ...prev,
        intrinsicsLoaded: cal.intrinsicsLoaded,
        checkerboardVisible: cal.checkerboardVisible,
        calibrated: cal.calibrated,
        lastCalibratedAt: cal.lastCalibratedAt || 'Never',
        currentStep: cal.currentStep,
        totalSteps: cal.totalSteps,
      }));
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  };

  const drawOverlay = () => {
    const img = referenceImageRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.naturalWidth || !img.naturalHeight) {
      return;
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw captured points
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = '#22c55e';
    ctx.font = '14px monospace';
    calibrationState.capturedPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.pixelX, point.pixelY, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(point.label || `P${index + 1}`, point.pixelX + 10, point.pixelY - 10);
    });

    // Draw target point
    if (calibrationState.targetPoint) {
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(
        calibrationState.targetPoint.pixelX,
        calibrationState.targetPoint.pixelY,
        14,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(
        calibrationState.targetPoint.label || 'NEXT',
        calibrationState.targetPoint.pixelX + 16,
        calibrationState.targetPoint.pixelY - 14,
      );
    }
  };

  const updateFlow = (data: Partial<CalibrationState>) => {
    setCalibrationState((prev) => ({ ...prev, ...data }));
    if (data.referenceImageBase64 && referenceImageRef.current) {
      referenceImageRef.current.src = `data:image/jpeg;base64,${data.referenceImageBase64}`;
    }
  };

  useEffect(() => {
    const img = referenceImageRef.current;

    if (!img || !calibrationState.referenceImageBase64) {
      return;
    }

    if (img.complete && img.naturalWidth && img.naturalHeight) {
      drawOverlay();
      return;
    }

    const handleLoad = () => {
      drawOverlay();
    };

    img.onload = handleLoad;

    return () => {
      if (img.onload === handleLoad) {
        img.onload = null;
      }
    };
  }, [
    calibrationState.capturedPoints,
    calibrationState.targetPoint,
    calibrationState.referenceImageBase64,
  ]);
  const runCalibration = async (action: 'start' | 'capture') => {
    try {
      const data = await apiClient.post<CalibrationFlowResponse>('/api/calibration', {
        action,
      });
      updateFlow(data);
      await refreshStatus();
    } catch (error) {
      console.error('Calibration action failed:', error);
    }
  };

  useEffect(() => {
    if (isActive) {
      refreshStatus();
    }
  }, [isActive]);

  const intrinsicsPill = setPill(calibrationState.intrinsicsLoaded);
  const checkerboardPill = setPill(calibrationState.checkerboardVisible);
  const calibratedPill = setPill(calibrationState.calibrated);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-1">Robot 4-Point Calibration</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Intrinsics are loaded from the configured camera JSON. This page runs the runtime 4-point
          robot calibration and shows when robot_mapping.json was last written.
        </p>
      </div>

      {/* Controls */}
      <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)]">
        <div className="flex gap-2">
          <button
            onClick={refreshStatus}
            className="px-4 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
          >
            Refresh Status
          </button>
          <button
            onClick={() => runCalibration('start')}
            className="px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium hover:bg-[var(--md-sys-color-primary)]/90 transition-colors"
          >
            Start Calibration
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)]">
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-2">Intrinsics</p>
          <div className={intrinsicsPill.className}>
            {intrinsicsPill.icon}
            {calibrationState.intrinsicsLoaded ? 'Loaded' : 'Missing'}
          </div>
        </div>

        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)]">
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-2">Checkerboard</p>
          <div className={checkerboardPill.className}>
            {checkerboardPill.icon}
            {calibrationState.checkerboardVisible ? 'Visible' : 'Not Found'}
          </div>
        </div>

        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)]">
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-2">
            Runtime Calibration
          </p>
          <div className={calibratedPill.className}>
            {calibratedPill.icon}
            {calibrationState.calibrated ? 'Ready' : 'Not Ready'}
          </div>
        </div>

        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)]">
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last Calibrated
          </p>
          <p className="text-sm font-medium">{calibrationState.lastCalibratedAt}</p>
        </div>
      </div>

      {/* Video Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)]">
          <label className="block text-sm font-medium mb-3">Raw Stream</label>
          <img
            id="rawFeed"
            alt="raw stream"
            className="w-full rounded-lg bg-black aspect-video object-cover"
          />
        </div>
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 bg-[var(--md-sys-color-surface-container-lowest)]">
          <label className="block text-sm font-medium mb-3">Detection Stream</label>
          <img
            id="detectionFeed"
            alt="detection stream"
            className="w-full rounded-lg bg-black aspect-video object-cover"
          />
        </div>
      </div>

      {/* Progress and Actions */}
      <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)]">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              Step{' '}
              <span className="text-[var(--md-sys-color-primary)]">
                {calibrationState.currentStep}
              </span>{' '}
              / {calibrationState.totalSteps}
            </p>
            <button
              onClick={() => runCalibration('capture')}
              className="px-4 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
            >
              Capture Current Point
            </button>
          </div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            {calibrationState.message}
          </p>
        </div>
      </div>

      {/* Reference Frame */}
      <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)]">
        <label className="block text-sm font-medium mb-4">Reference Frame</label>
        <div className="relative bg-black rounded-lg overflow-hidden">
          <img
            ref={referenceImageRef}
            id="referenceImage"
            alt="reference frame"
            className="w-full block"
          />
          <canvas
            ref={canvasRef}
            id="referenceOverlay"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
