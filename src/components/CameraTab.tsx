import { CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { CameraView } from './CameraView';

interface CameraTabProps {
  onNext?: () => void;
}

export function CameraTab({ onNext }: CameraTabProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl mb-1">Camera Preview & Verification</h2>
          <p className="text-sm text-(--md-sys-color-on-surface-variant)">
            Verify camera feed, lighting conditions, and battery detection before starting the scan
          </p>
        </div>
      </div>

      {/* Camera Feed & Confirmation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CameraView title="Live Camera Feed" showStatus={true} height="standard" />
        </div>

        {/* Confirmation Section */}
        <div className="border border-(--md-sys-color-primary) rounded-2xl p-6 bg-(--md-sys-color-primary-container)/10 flex flex-col justify-center">
          <h3 className="font-medium mb-3">Ready to Continue?</h3>
          <p className="text-sm text-(--md-sys-color-on-surface-variant) mb-6">
            Once you've verified the camera feed, lighting conditions, and battery detection, proceed to route planning.
          </p>
          <div className="text-xs text-(--md-sys-color-on-surface-variant)">
            Make sure the preview is stable before proceeding.
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <section className="border border-(--md-sys-color-outline-variant) rounded-2xl p-6 bg-(--md-sys-color-surface-container-lowest)">
        <h3 className="font-medium mb-4">Pre-Scan Verification Checklist</h3>
        
        <div className="space-y-4">
          {/* Lighting Check */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-(--md-sys-color-surface)">
            <div className="p-2 bg-(--md-sys-color-tertiary-container) rounded-lg">
              <CheckCircle className="w-5 h-5 text-(--md-sys-color-on-tertiary-container)" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">Lighting Conditions</h4>
              <p className="text-sm text-(--md-sys-color-on-surface-variant)">
                Ensure consistent, uniform lighting across the scan area. Avoid direct sunlight or harsh shadows that could affect spectral readings.
              </p>
            </div>
          </div>

          {/* Camera Settings Check */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-(--md-sys-color-surface)">
            <div className="p-2 bg-(--md-sys-color-secondary-container) rounded-lg">
              <CheckCircle className="w-5 h-5 text-(--md-sys-color-on-secondary-container)" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">Camera Focus & Position</h4>
              <p className="text-sm text-(--md-sys-color-on-surface-variant)">
                Verify that the camera is properly focused and positioned to capture the entire battery scan area. Check that the frame is stable and aligned.
              </p>
            </div>
          </div>

          {/* CSV Detection Check */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-(--md-sys-color-surface)">
            <div className="p-2 bg-(--md-sys-color-primary-container) rounded-lg">
              <AlertTriangle className="w-5 h-5 text-(--md-sys-color-on-primary-container)" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">Battery Detection</h4>
              <p className="text-sm text-(--md-sys-color-on-surface-variant) mb-3">
                Confirm that the battery detection algorithm correctly identifies battery positions. Verify that all expected batteries are detected and properly marked.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end pt-4 border-t border-(--md-sys-color-outline-variant)">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) rounded-full flex items-center gap-2 hover:shadow-lg transition-all text-sm"
        >
          Continue to Route
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
