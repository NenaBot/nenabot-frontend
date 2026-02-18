import { Camera } from 'lucide-react';

interface CameraViewProps {
  title?: string;
  showStatus?: boolean;
  height?: 'compact' | 'standard' | 'full';
}

export function CameraView({ 
  title = 'Live Camera Feed', 
  showStatus = true,
  height = 'standard'
}: CameraViewProps) {
  const heightMap = {
    compact: 'aspect-video',
    standard: 'aspect-video',
    full: 'h-[600px]'
  };

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <h3 className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{title}</h3>
        </div>
        {showStatus && (
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--md-sys-color-primary-container)] rounded-full text-xs text-[var(--md-sys-color-on-primary-container)]">
            <div className="w-2 h-2 bg-[var(--md-sys-color-primary)] rounded-full animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* Camera Feed Placeholder */}
      <div className={`${heightMap[height]} w-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center`}>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center mx-auto mb-3">
            <Camera className="w-8 h-8 text-[var(--md-sys-color-on-primary-container)]" />
          </div>
          <h4 className="text-base font-medium text-[var(--md-sys-color-on-surface)] mb-1">Camera Feed</h4>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Camera stream will appear here when connected
          </p>
        </div>
      </div>
    </div>
  );
}
