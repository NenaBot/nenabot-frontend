import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader, ChevronRight } from 'lucide-react';
import { useCalibration } from '../../hooks/useCalibration';
import { fetchStatusRoute } from '../../services/apiCalls';
import { isMockModeEnabled } from '../../state/mockMode';

interface CalibrationTabProps {
  onNext?: () => void;
  isActive?: boolean;
}

export function CalibrationTab({ onNext, isActive = true }: CalibrationTabProps) {
  const calibration = useCalibration();
  const [canStart, setCanStart] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    intrinsicsLoaded: boolean;
    checkerboardVisible: boolean;
  } | null>(null);

  // Check system status on mount and when tab becomes active
  useEffect(() => {
    if (!isActive || !isMockModeEnabled()) {
      return;
    }

    const checkStatus = async () => {
      try {
        const status = await fetchStatusRoute();
        setSystemStatus({
          intrinsicsLoaded: status.calibration?.intrinsicsLoaded ?? false,
          checkerboardVisible: status.calibration?.checkerboardVisible ?? false,
        });
      } catch (err) {
        console.error('Failed to check calibration status:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Update can start condition
  useEffect(() => {
    const intrinsicsOk = isMockModeEnabled() ? true : systemStatus?.intrinsicsLoaded ?? false;
    setCanStart(intrinsicsOk && !calibration.isInProgress);
  }, [systemStatus, calibration.isInProgress]);

  const handleStartClick = async () => {
    await calibration.startCalibration();
  };

  const handleCaptureClick = async () => {
    await calibration.capturePoint();
  };

  const handleResetClick = () => {
    calibration.reset();
  };

  const getStatusColor = (): string => {
    if (calibration.error) return 'text-red-600';
    if (calibration.calibrated) return 'text-green-600';
    if (calibration.isInProgress) return 'text-blue-600';
    return 'text-gray-600';
  };

  const renderPointCapture = () => {
    if (!calibration.isInProgress) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Reference Image with Target Point */}
        {calibration.referenceImage && (
          <div className="relative border border-[var(--md-sys-color-outline-variant)] rounded-xl overflow-hidden bg-black">
            <div className="aspect-video relative flex items-center justify-center bg-gray-900">
              <img
                src={`data:image/jpeg;base64,${calibration.referenceImage}`}
                alt="Reference frame"
                className="w-full h-full object-contain"
              />

              {/* Target Point Overlay */}
              {calibration.targetPoint && (
                <div
                  className="absolute w-12 h-12 border-4 border-red-500 rounded-full flex items-center justify-center bg-red-500/10 animate-pulse"
                  style={{
                    left: `${calibration.targetPoint.pixelX}px`,
                    top: `${calibration.targetPoint.pixelY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="absolute inset-1 border-2 border-red-500 rounded-full" />
                  {calibration.targetPoint.label && (
                    <span className="absolute -bottom-6 text-xs font-bold text-red-600 whitespace-nowrap">
                      {calibration.targetPoint.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Current Step Badge */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm font-medium text-white">
              Step {calibration.currentStep}/{calibration.totalSteps}
            </div>
          </div>
        )}

        {/* Captured Points Tracker */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: calibration.totalSteps }).map((_, index) => {
            const pointNumber = index + 1;
            const isCaptured = calibration.capturedPoints.length > index;
            const isTarget = calibration.currentStep === pointNumber;

            return (
              <div
                key={pointNumber}
                className={`p-3 rounded-lg text-center text-sm font-medium transition-all ${
                  isCaptured
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : isTarget
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-400 animate-pulse'
                      : 'bg-gray-100 text-gray-500 border border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {isCaptured ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4" />}
                  <span>P{pointNumber}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        <div className={`p-4 rounded-lg border ${getStatusColor().includes('red') ? 'bg-red-50 border-red-300' : getStatusColor().includes('green') ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'}`}>
          <p className={`text-sm font-medium ${getStatusColor()}`}>{calibration.message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={handleResetClick}
            className="px-4 py-2 text-sm font-medium text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)] rounded-full hover:bg-[var(--md-sys-color-primary)]/5 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleCaptureClick}
            disabled={calibration.isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-[var(--md-sys-color-primary)] rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {calibration.isLoading && <Loader className="w-4 h-4 animate-spin" />}
            Capture Current Point
          </button>
        </div>
      </div>
    );
  };

  const renderNotReady = () => {
    const issues = [];
    if (!systemStatus?.intrinsicsLoaded) {
      issues.push('Camera intrinsics not loaded - contact administrator');
    }
    if (!systemStatus?.checkerboardVisible) {
      issues.push('Checkerboard not visible - adjust camera or place calibration board');
    }

    return (
      <div className="space-y-4">
        <div className="p-6 rounded-xl bg-amber-50 border border-amber-300">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Calibration Not Ready</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                {issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl mb-1">Camera & Robot Calibration</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Calibrate the camera-to-robot coordinate mapping by touching 4 calibration points on the
          checkerboard
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-[var(--md-sys-color-primary-container)] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[var(--md-sys-color-on-primary-container)]" />
            </div>
            <h3 className="font-medium">What You'll Need</h3>
          </div>
          <ul className="text-sm text-[var(--md-sys-color-on-surface-variant)] space-y-2">
            <li>✓ Printed A3 calibration checkerboard (9×7 squares)</li>
            <li>✓ Flat surface to place the board</li>
            <li>✓ Clear view of checkerboard in camera</li>
            <li>✓ Robot arm unlocked and accessible</li>
          </ul>
        </div>

        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-[var(--md-sys-color-secondary-container)] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[var(--md-sys-color-on-secondary-container)]" />
            </div>
            <h3 className="font-medium">Calibration Steps</h3>
          </div>
          <ol className="text-sm text-[var(--md-sys-color-on-surface-variant)] space-y-2">
            <li>1. Click "Start Calibration"</li>
            <li>2. Move robot tip to red target point</li>
            <li>3. Click "Capture Current Point"</li>
            <li>4. Repeat for all 4 points</li>
          </ol>
        </div>
      </div>

      {/* Main Content */}
      {calibration.isInProgress ? renderPointCapture() : canStart ? (
        <div className="space-y-4">
          {calibration.calibrated && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-300">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-700">Calibration Complete!</p>
                  <p className="text-xs text-green-600 mt-1">
                    Last calibrated: {calibration.lastCalibratedAt}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
            <button
              onClick={handleStartClick}
              disabled={calibration.isLoading}
              className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full flex items-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              {calibration.isLoading && <Loader className="w-4 h-4 animate-spin" />}
              {calibration.calibrated ? 'Recalibrate' : 'Start Calibration'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        renderNotReady()
      )}

      {/* Error Display */}
      {calibration.error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-300">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Error</p>
              <p className="text-sm text-red-600 mt-1">{calibration.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      {calibration.calibrated && onNext && (
        <div className="flex items-center justify-end pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <button
            onClick={onNext}
            className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full flex items-center gap-2 hover:shadow-lg transition-all text-sm font-medium"
          >
            Continue to Camera
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
