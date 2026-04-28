import { Grid3x3 } from 'lucide-react';
import { RoutePreviewCoordinate, RoutePreviewPoint } from '../../types/routePreview.types';
import { RoutePreviewSvgLayer } from './routePreview/RoutePreviewSvgLayer';
import { RoutePreviewToolbar } from './routePreview/RoutePreviewToolbar';
import { useRoutePreviewCamera } from './routePreview/hooks/useRoutePreviewCamera';
import { useRoutePreviewDrag } from './routePreview/hooks/useRoutePreviewDrag';

interface RoutePreviewPanelProps {
  title?: string;
  imageUrl?: string | null;
  imageAspectRatio?: number;
  routePath?: RoutePreviewCoordinate[];
  measurementPoints?: RoutePreviewPoint[];
  selectedPointId?: string | null;
  criticalPointIds?: string[];
  cornerPointIds?: string[];
  draggablePointIds?: string[];
  onSelectPoint?: (pointId: string) => void;
  disablePointSelection?: boolean;
  enablePointDragging?: boolean;
  onPointDragEnd?: (pointId: string, newX: number, newY: number) => void;
}

export type { RoutePreviewCoordinate, RoutePreviewPoint };

export function RoutePreviewPanel({
  title = 'Scan Area Preview',
  imageUrl,
  imageAspectRatio,
  routePath = [],
  measurementPoints = [],
  selectedPointId = null,
  criticalPointIds = [],
  cornerPointIds = [],
  draggablePointIds = [],
  onSelectPoint,
  disablePointSelection = false,
  enablePointDragging = false,
  onPointDragEnd,
}: RoutePreviewPanelProps) {
  const camera = useRoutePreviewCamera();
  const drag = useRoutePreviewDrag(enablePointDragging, onPointDragEnd);
  const hasOverlayData = routePath.length > 0 || measurementPoints.length > 0;
  const showGridOverlay = !imageUrl;
  const viewportAspectRatio = imageAspectRatio && imageAspectRatio > 0 ? imageAspectRatio : 16 / 9;
  const imageTransform = `scale(${camera.zoom}) translate(${-camera.panX}%, ${-camera.panY}%)`;

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

      <div
        className="w-full matrix-canvas relative overflow-hidden"
        style={{ aspectRatio: viewportAspectRatio }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Scan area preview"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              transformOrigin: 'top left',
              transform: imageTransform,
            }}
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
          viewportAspectRatio={viewportAspectRatio}
          selectedPointId={selectedPointId}
          criticalPointIds={criticalPointIds}
          cornerPointIds={cornerPointIds}
          draggablePointIds={draggablePointIds}
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
          <>
            <div className="absolute inset-0 pointer-events-none opacity-30 matrix-grid-fine" />
            <div className="absolute inset-0 pointer-events-none opacity-40 matrix-grid-major" />
            <div className="absolute inset-0 pointer-events-none opacity-25 matrix-vignette" />
            <div className="absolute inset-0 pointer-events-none opacity-20 matrix-scanline" />
          </>
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
