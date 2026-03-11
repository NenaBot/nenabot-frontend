import { Grid3x3, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

export function RoutePreviewPanel() {
  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <h3 className="text-sm font-medium">Scan Area Preview</h3>
        </div>
        <div className="flex gap-1">
          <button
            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded transition-colors"
            title="Fit to screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full aspect-video bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center relative">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center mx-auto mb-3">
            <Grid3x3 className="w-8 h-8 text-[var(--md-sys-color-on-primary-container)]" />
          </div>
          <h4 className="text-base font-medium text-[var(--md-sys-color-on-surface)] mb-1">
            Map Preview
          </h4>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Configure scan parameters to preview the route
          </p>
        </div>

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(var(--md-sys-color-on-surface) 1px, transparent 1px), linear-gradient(90deg, var(--md-sys-color-on-surface) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>
    </div>
  );
}
