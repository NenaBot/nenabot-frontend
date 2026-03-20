import { Grid3x3, ZoomIn, ZoomOut } from 'lucide-react';

interface RoutePreviewToolbarProps {
  title: string;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function RoutePreviewToolbar({
  title,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
}: RoutePreviewToolbarProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
      <div className="flex items-center gap-2">
        <Grid3x3 className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] disabled:opacity-50 rounded transition-colors"
          title="Zoom in"
          aria-label="Zoom in"
          disabled={!canZoomIn}
          onClick={onZoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] disabled:opacity-50 rounded transition-colors"
          title="Zoom out"
          aria-label="Zoom out"
          disabled={!canZoomOut}
          onClick={onZoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
