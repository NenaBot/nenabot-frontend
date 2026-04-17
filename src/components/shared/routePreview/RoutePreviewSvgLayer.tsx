import { polylineFromPoints } from './geometry';
import { RoutePreviewCoordinate, RoutePreviewPoint } from '../../../types/routePreview.types';

interface RoutePreviewSvgLayerProps {
  routePath: RoutePreviewCoordinate[];
  measurementPoints: RoutePreviewPoint[];
  selectedPointId: string | null;
  criticalPointIds: string[];
  cornerPointIds: string[];
  draggablePointIds: string[];
  disablePointSelection: boolean;
  enablePointDragging: boolean;
  viewBox: string;
  draggedPointId: string | null;
  hoveredPointId: string | null;
  isPanning: boolean;
  onPointMouseDown: (pointId: string, event: React.MouseEvent<SVGGElement>) => void;
  onPointHover: (pointId: string | null) => void;
  onSelectPoint?: (pointId: string) => void;
  onMouseMove: (event: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp: () => void;
  onMouseDown: (event: React.MouseEvent<SVGSVGElement>) => void;
  onWheel: (event: React.WheelEvent<SVGSVGElement>) => void;
  getDisplayPosition: (point: RoutePreviewPoint) => { x: number; y: number };
}

export function RoutePreviewSvgLayer({
  routePath,
  measurementPoints,
  selectedPointId,
  criticalPointIds,
  cornerPointIds,
  draggablePointIds,
  disablePointSelection,
  enablePointDragging,
  viewBox,
  draggedPointId,
  hoveredPointId,
  isPanning,
  onPointMouseDown,
  onPointHover,
  onSelectPoint,
  onMouseMove,
  onMouseUp,
  onMouseDown,
  onWheel,
  getDisplayPosition,
}: RoutePreviewSvgLayerProps) {
  const renderedPoints = measurementPoints.map((point) => ({
    point,
    displayPos: getDisplayPosition(point),
  }));
  // Draw the route only from backend-populated ordered path data.
  const polyline = polylineFromPoints(routePath);

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full"
      role="img"
      aria-label="Route preview"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      style={{ cursor: draggedPointId ? 'grabbing' : isPanning ? 'grabbing' : 'default' }}
    >
      {polyline.length > 0 && (
        <>
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--md-sys-color-surface)"
            strokeOpacity="0.55"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--md-sys-color-primary)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}

      {renderedPoints.map(({ point, displayPos }) => {
        const isSelected = point.id === selectedPointId;
        const isCritical = criticalPointIds.includes(point.id);
        const isCorner = cornerPointIds.includes(point.id);
        const isDraggable = enablePointDragging && draggablePointIds.includes(point.id);
        const isDragging = draggedPointId === point.id;
        const isLabelVisible = isSelected || isDragging || hoveredPointId === point.id;

        return (
          <g
            key={point.id}
            onMouseDown={(event) => {
              if (isDraggable) {
                onPointMouseDown(point.id, event);
              }
            }}
            onMouseEnter={() => onPointHover(point.id)}
            onMouseLeave={() => onPointHover(null)}
            style={{
              cursor: isDraggable ? 'grab' : 'default',
            }}
            role="button"
            aria-label={`Point ${point.label}`}
          >
            <circle
              cx={displayPos.x}
              cy={displayPos.y}
              r={isSelected ? 3.4 : 2.8}
              fill={
                isSelected
                  ? 'var(--md-sys-color-tertiary)'
                  : isCritical
                    ? 'var(--md-sys-color-error)'
                    : isCorner
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-secondary)'
              }
              stroke="var(--md-sys-color-surface)"
              strokeWidth={isDragging ? '0.8' : '1.0'}
              vectorEffect="non-scaling-stroke"
              opacity={isDragging ? 0.8 : 1}
              className={disablePointSelection ? '' : 'cursor-pointer'}
              onClick={() => {
                if (!disablePointSelection && onSelectPoint) {
                  onSelectPoint(point.id);
                }
              }}
            >
              {isSelected && (
                <animate
                  attributeName="opacity"
                  values="1;0.65;1"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            {isLabelVisible && (
              <text
                x={displayPos.x}
                y={displayPos.y}
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="2.3"
                fontWeight="600"
                fill="var(--md-sys-color-on-surface)"
                pointerEvents="none"
                vectorEffect="non-scaling-stroke"
              >
                {point.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
