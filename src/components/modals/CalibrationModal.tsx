import { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader, ChevronRight, X } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useCalibration } from '../../hooks/useCalibration';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalibrationModal({ isOpen, onClose }: CalibrationModalProps) {
  const [dark] = useDarkMode();
  const calibration = useCalibration();
  const [isStarting, setIsStarting] = useState(false);

  if (!isOpen) return null;

  const handleStart = async () => {
    setIsStarting(true);
    await calibration.startCalibration();
    setIsStarting(false);
  };

  const handleCapture = async () => {
    await calibration.capturePoint();
  };

  const handleReset = () => {
    calibration.reset();
  };

  const handleClose = () => {
    calibration.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[var(--md-sys-color-outline-variant)]">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
              Camera & Robot Calibration
            </h2>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Guide the robot arm to 4 calibration points
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 hover:bg-[var(--md-sys-color-surface-container)] rounded-lg transition-colors active:bg-[var(--md-sys-color-surface-container-high)]"
            title="Close"
          >
            <X className="w-7 h-7 text-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] transition-colors font-semibold" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Reference Image with Target Point */}
          {calibration.referenceImage && calibration.isInProgress ? (
            <div className="space-y-4">
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

                {/* Step Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm font-medium text-white">
                  Step {calibration.currentStep}/{calibration.totalSteps}
                </div>
              </div>

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
                          ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border border-[var(--md-sys-color-tertiary)]'
                          : isTarget
                            ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-2 border-[var(--md-sys-color-primary)] animate-pulse'
                            : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isCaptured ? (
                          <CheckCircle className="w-5 h-5 text-[var(--md-sys-color-tertiary)] font-semibold flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                        <span>P{pointNumber}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Message */}
              <div
                className={`p-4 rounded-lg border ${
                  calibration.error
                    ? 'bg-[var(--md-sys-color-error-container)] border-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error-container)]'
                    : calibration.calibrated
                      ? 'bg-[var(--md-sys-color-tertiary-container)] border-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary-container)]'
                      : 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary-container)]'
                }`}
              >
                <p className="text-sm font-medium">{calibration.message}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)] rounded-lg hover:bg-[var(--md-sys-color-primary)]/10 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleCapture}
                  disabled={calibration.isLoading}
                  className="px-6 py-2 text-sm font-medium text-[var(--md-sys-color-on-primary)] bg-[var(--md-sys-color-primary)] rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {calibration.isLoading && (
                    <Loader className="w-5 h-5 animate-spin font-semibold" />
                  )}
                  Capture Current Point
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg p-4 bg-[var(--md-sys-color-primary-container)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2.5 bg-[var(--md-sys-color-primary)] rounded-lg shadow-sm flex-shrink-0">
                      <CheckCircle
                        className="w-6 h-6 font-semibold"
                        style={{ color: dark ? 'black' : 'white' }}
                      />
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--md-sys-color-on-primary-container)]">
                      You&apos;ll Need
                    </h3>
                  </div>
                  <ul className="text-xs text-[var(--md-sys-color-on-primary-container)] space-y-1">
                    <li>✓ A3 calibration checkerboard</li>
                    <li>✓ Flat surface</li>
                    <li>✓ Clear camera view</li>
                    <li>✓ Robot arm unlocked</li>
                  </ul>
                </div>

                <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg p-4 bg-[var(--md-sys-color-secondary-container)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2.5 bg-[var(--md-sys-color-secondary)] rounded-lg shadow-sm flex-shrink-0">
                      <CheckCircle
                        className="w-6 h-6 font-semibold"
                        style={{ color: dark ? 'black' : 'white' }}
                      />
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--md-sys-color-on-secondary-container)]">
                      Steps
                    </h3>
                  </div>
                  <ol className="text-xs text-[var(--md-sys-color-on-secondary-container)] space-y-1">
                    <li>1. Click &quot;Start&quot;</li>
                    <li>2. Move robot to red point</li>
                    <li>3. Click &quot;Capture&quot;</li>
                    <li>4. Repeat 4 times</li>
                  </ol>
                </div>
              </div>

              {/* Calibration Status */}
              {calibration.calibrated ? (
                <div className="p-4 rounded-lg bg-[var(--md-sys-color-tertiary-container)] border border-[var(--md-sys-color-tertiary)]">
                  <div className="flex gap-3">
                    <CheckCircle className="w-6 h-6 text-[var(--md-sys-color-tertiary)] flex-shrink-0 mt-0 font-semibold" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--md-sys-color-on-tertiary-container)]">
                        Already Calibrated
                      </p>
                      <p className="text-xs text-[var(--md-sys-color-on-tertiary-container)] mt-1">
                        Last calibrated: {calibration.lastCalibratedAt}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Error Display */}
              {calibration.error && (
                <div className="p-4 rounded-lg bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-6 h-6 text-[var(--md-sys-color-error)] flex-shrink-0 mt-0 font-semibold" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--md-sys-color-on-error-container)]">
                        Error
                      </p>
                      <p className="text-sm text-[var(--md-sys-color-on-error-container)] mt-1">
                        {calibration.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] p-6 flex gap-3 justify-end">
          {!calibration.isInProgress ? (
            <>
              <button
                onClick={handleClose}
                className="px-6 py-2 text-sm font-medium text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleStart}
                disabled={isStarting}
                className="px-6 py-2 text-sm font-medium text-[var(--md-sys-color-on-primary)] bg-[var(--md-sys-color-primary)] rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isStarting && <Loader className="w-5 h-5 animate-spin font-semibold" />}
                {calibration.calibrated ? 'Recalibrate' : 'Start Calibration'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-6 py-2 text-sm font-medium text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                Close
              </button>
              {calibration.calibrated && (
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  Done
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
