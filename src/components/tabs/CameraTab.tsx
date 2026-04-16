import { CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { CameraView } from '../CameraView';

interface CameraTabProps {
  onNext?: () => void;
  isActive?: boolean;
}

export function CameraTab({ onNext, isActive = true }: CameraTabProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl mb-1">Camera Preview & Verification</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Verify camera feed, lighting conditions, and battery detection before starting the scan
        </p>
      </div>

      {/* Camera Feed - Full Width */}
      {isActive && (
        <CameraView
          title="Live Detection Feed"
          showStatus={true}
          height="standard"
          streamKind="detection"
          isActive={isActive}
        />
      )}

      {/* Verification Checklist - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lighting Check */}
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-[var(--md-sys-color-tertiary-container)] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[var(--md-sys-color-on-tertiary-container)]" />
            </div>
            <h3 className="font-medium">Lighting Conditions</h3>
          </div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Ensure consistent, uniform lighting across the scan area. Avoid direct sunlight or harsh
            shadows that could affect spectral readings.
          </p>
        </div>

        {/* Camera Settings Check */}
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-[var(--md-sys-color-secondary-container)] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[var(--md-sys-color-on-secondary-container)]" />
            </div>
            <h3 className="font-medium">Camera Focus & Position</h3>
          </div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Verify that the camera is properly focused and positioned to capture the entire battery
            scan area. Check that the frame is stable and aligned.
          </p>
        </div>

        {/* Battery Detection Check */}
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-[var(--md-sys-color-primary-container)] rounded-lg">
              <AlertTriangle className="w-5 h-5 text-[var(--md-sys-color-on-primary-container)]" />
            </div>
            <h3 className="font-medium">Battery Detection</h3>
          </div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Confirm that the battery detection algorithm correctly identifies battery positions.
            Verify that all expected batteries are detected and properly marked.
          </p>
        </div>
      </div>

      {/* Footer Button */}
      <div className="flex items-center justify-end pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full flex items-center gap-2 hover:shadow-lg transition-all text-sm"
        >
          Continue to Route
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
