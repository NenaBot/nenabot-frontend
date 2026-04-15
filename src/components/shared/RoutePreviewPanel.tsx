import { Grid3x3 } from 'lucide-react';
import { RoutePreviewCoordinate, RoutePreviewPoint } from '../../types/routePreview.types';
import { RoutePreviewSvgLayer } from './routePreview/RoutePreviewSvgLayer';
import { useRoutePreviewDrag } from './routePreview/hooks/useRoutePreviewDrag';

interface RoutePreviewPanelProps {
  title?: string;
  imageUrl?: string | null;
  routePath?: RoutePreviewCoordinate[];
  measurementPoints?: RoutePreviewPoint[];
  selectedPointId?: string | null;
  criticalPointIds?: string[];
  cornerPointIds?: string[];
  draggablePointIds?: string[];
  onSelectPoint?: (pointId: string) => void;
  disablePointSelection?: boolean;
  enablePointDragging?: boolean;
  alwaysShowLabels?: boolean;
  onPointDragMove?: (pointId: string, newX: number, newY: number) => void;
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
  cornerPointIds = [],
  draggablePointIds = [],
  onSelectPoint,
  disablePointSelection = false,
  enablePointDragging = false,
  alwaysShowLabels = false,
  onPointDragMove,
  onPointDragEnd,
}: RoutePreviewPanelProps) {
  const drag = useRoutePreviewDrag(enablePointDragging, onPointDragMove, onPointDragEnd);
  const hasOverlayData = routePath.length > 0 || measurementPoints.length > 0;
  const showGridOverlay = !imageUrl;

  const handleSvgMouseUp = () => {
    drag.completeDrag();
  };

  return (
    <div className="border border-(--md-sys-color-outline-variant) rounded-2xl overflow-hidden bg-(--md-sys-color-surface-container-lowest)">
      <div className="border-b border-(--md-sys-color-outline-variant) px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-(--md-sys-color-on-surface)">{title}</h3>
          <p className="text-xs text-(--md-sys-color-on-surface-variant)">
            Fixed-frame route preview
          </p>
        </div>
      </div>

      <div className="w-full aspect-video matrix-canvas relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Scan area preview"
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-(--md-sys-color-primary-container) rounded-full flex items-center justify-center mx-auto mb-3">
                <Grid3x3 className="w-8 h-8 text-(--md-sys-color-on-primary-container)" />
              </div>
              <h4 className="text-base font-medium text-(--md-sys-color-on-surface) mb-1">
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
          cornerPointIds={cornerPointIds}
          draggablePointIds={draggablePointIds}
          disablePointSelection={disablePointSelection}
          enablePointDragging={enablePointDragging}
          alwaysShowLabels={alwaysShowLabels}
          viewBox="0 0 100 100"
          draggedPointId={drag.draggedPointId}
          hoveredPointId={drag.hoveredPointId}
          isPanning={false}
          onPointMouseDown={drag.beginDrag}
          onPointHover={drag.setHoveredPointId}
          onSelectPoint={onSelectPoint}
          onMouseMove={drag.updateDrag}
          onMouseUp={handleSvgMouseUp}
          onMouseDown={() => undefined}
          onWheel={() => undefined}
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
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-(--md-sys-color-surface)/85 text-xs text-(--md-sys-color-on-surface-variant)">
            No route data available.
          </div>
        )}
      </div>
    </div>
  );
}
