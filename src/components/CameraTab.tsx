import { Camera, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

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

      {/* Camera Feed */}
      <section className="border border-(--md-sys-color-outline-variant) rounded-2xl overflow-hidden bg-(--md-sys-color-surface-container-lowest)">
        <div className="flex items-center justify-between px-5 py-3 border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface)">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-(--md-sys-color-on-surface-variant)" />
            <h3 className="font-medium">Live Camera Feed</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-(--md-sys-color-primary-container) rounded-full text-xs text-(--md-sys-color-on-primary-container)">
            <div className="w-2 h-2 bg-(--md-sys-color-primary) rounded-full animate-pulse" />
            Live
          </div>
        </div>
        
        {/* Camera View Placeholder */}
        <div className="aspect-video bg-(--md-sys-color-surface-variant) flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-(--md-sys-color-primary-container) rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-(--md-sys-color-on-primary-container)" />
            </div>
            <h4 className="text-lg mb-2">Camera Feed</h4>
            <p className="text-sm text-(--md-sys-color-on-surface-variant)">
              Camera stream will appear here when connected
            </p>
          </div>
        </div>
      </section>

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
              <h4 className="font-medium mb-1">CSV Battery Detection</h4>
              <p className="text-sm text-(--md-sys-color-on-surface-variant) mb-3">
                Confirm that the battery detection algorithm correctly identifies battery positions from the CSV file. Verify that all expected batteries are detected and properly marked.
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-(--md-sys-color-surface-variant) rounded">
                  Status: Pending Verification
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Section */}
      <div className="border border-(--md-sys-color-primary) rounded-2xl p-6 bg-(--md-sys-color-primary-container)/10">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-medium mb-2">Ready to Continue?</h3>
            <p className="text-sm text-(--md-sys-color-on-surface-variant)">
              Once you've verified the camera feed, lighting conditions, and battery detection, proceed to the route planning stage.
            </p>
          </div>
          <button 
            onClick={onNext}
            className="px-6 py-3 bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) rounded-full flex items-center gap-2 hover:shadow-lg transition-all text-sm whitespace-nowrap"
          >
            Continue to Route Planning
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
