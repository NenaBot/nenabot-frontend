import { Grid3x3 } from 'lucide-react';
import { RoutePreviewCoordinate, RoutePreviewPoint } from '../../types/routePreview.types';
import { RoutePreviewSvgLayer } from './routePreview/RoutePreviewSvgLayer';
import { RoutePreviewToolbar } from './routePreview/RoutePreviewToolbar';
import { useRoutePreviewCamera } from './routePreview/hooks/useRoutePreviewCamera';
import { useRoutePreviewDrag } from './routePreview/hooks/useRoutePreviewDrag';

interface RoutePreviewPanelProps {
  title?: string;
  imageUrl?: string | null;
  routePath?: RoutePreviewCoordinate[];
  measurementPoints?: RoutePreviewPoint[];
  selectedPointId?: string | null;
  criticalPointIds?: string[];
  onSelectPoint?: (pointId: string) => void;
  disablePointSelection?: boolean;
  enablePointDragging?: boolean;
  onPointDragEnd?: (pointId: string, newX: number, newY: number) => void;
}

export type { RoutePreviewCoordinate, RoutePreviewPoint };

export function RoutePreviewPanel({
  title = 'Scan Area Preview',
  imageUrl,
  routePath = [],
  measurementPoints = [],
  selectedPointId = null,
  criticalPointIds = [],
  onSelectPoint,
  disablePointSelection = false,
  enablePointDragging = false,
  onPointDragEnd,
}: RoutePreviewPanelProps) {
  const camera = useRoutePreviewCamera();
  const drag = useRoutePreviewDrag(enablePointDragging, onPointDragEnd);
  const hasOverlayData = routePath.length > 0 || measurementPoints.length > 0;
  const showGridOverlay = !imageUrl;

  const handleSvgMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    // Start panning only from the empty canvas area, not from point elements.
    if (event.target !== event.currentTarget || drag.isDragging) {
      return;
    }
    camera.beginPan(event);
  };

  const handleSvgMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (drag.isDragging) {
      drag.updateDrag(event);
      return;
    }
    camera.movePan(event);
  };

  const handleSvgMouseUp = () => {
    drag.completeDrag();
    camera.endPan();
  };

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      <RoutePreviewToolbar
        title={title}
        canZoomIn={camera.canZoomIn}
        canZoomOut={camera.canZoomOut}
        onZoomIn={camera.zoomIn}
        onZoomOut={camera.zoomOut}
      />

      <div className="w-full aspect-video bg-[var(--md-sys-color-surface-variant)] relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Scan area preview"
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center mx-auto mb-3">
                <Grid3x3 className="w-8 h-8 text-[var(--md-sys-color-on-primary-container)]" />
              </div>
              <h4 className="text-base font-medium text-[var(--md-sys-color-on-surface)] mb-1">
                Map Preview
              </h4>
            </div>
          </div>
        )}

        <RoutePreviewSvgLayer
          routePath={routePath}
          measurementPoints={measurementPoints}
          selectedPointId={selectedPointId}
          criticalPointIds={criticalPointIds}
          disablePointSelection={disablePointSelection}
          enablePointDragging={enablePointDragging}
          viewBox={camera.viewBox}
          draggedPointId={drag.draggedPointId}
          hoveredPointId={drag.hoveredPointId}
          isPanning={camera.isPanning}
          onPointMouseDown={drag.beginDrag}
          onPointHover={drag.setHoveredPointId}
          onSelectPoint={onSelectPoint}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseDown={handleSvgMouseDown}
          onWheel={camera.handleWheel}
          getDisplayPosition={drag.getDisplayPosition}
        />

        {showGridOverlay && (
          <div
            className="absolute inset-0 opacity-8 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(var(--md-sys-color-on-surface) 1px, transparent 1px), linear-gradient(90deg, var(--md-sys-color-on-surface) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
        )}

        {!hasOverlayData && !imageUrl && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-[var(--md-sys-color-surface)]/85 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            No route data available.
          </div>
        )}
      </div>
    </div>
  );
}
