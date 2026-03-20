import { useMemo, useState } from 'react';
import { Grid3x3, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

export interface RoutePreviewCoordinate {
  x: number;
  y: number;
}

export interface RoutePreviewPoint extends RoutePreviewCoordinate {
  id: string;
  label: string;
}

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

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

function toSvgPoint(value: number): number {
  return Math.max(0, Math.min(1, value)) * 100;
}

function createPathPolyline(points: RoutePreviewCoordinate[]): string {
  return points.map((point) => `${toSvgPoint(point.x)},${toSvgPoint(point.y)}`).join(' ');
}

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const [draggedPointPos, setDraggedPointPos] = useState<{ x: number; y: number } | null>(null);
  const hasOverlayData = routePath.length > 0 || measurementPoints.length > 0;
  const showGridOverlay = !imageUrl;

  const polyline = useMemo(() => createPathPolyline(routePath), [routePath]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP));
  const handleFitToScreen = () => setZoomLevel(1);

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>, pointId?: string) => {
    if (!enablePointDragging || !pointId) return;
    setDraggedPointId(pointId);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!enablePointDragging || !draggedPointId) return;

    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    const screenCTM = svg.getScreenCTM();
    if (screenCTM) {
      const localPt = pt.matrixTransform(screenCTM.inverse());
      setDraggedPointPos({
        x: Math.max(0, Math.min(100, localPt.x)) / 100,
        y: Math.max(0, Math.min(100, localPt.y)) / 100,
      });
    }
  };

  const handleSvgMouseUp = () => {
    if (!enablePointDragging || !draggedPointId || !draggedPointPos) {
      setDraggedPointId(null);
      setDraggedPointPos(null);
      return;
    }

    if (onPointDragEnd) {
      onPointDragEnd(draggedPointId, draggedPointPos.x, draggedPointPos.y);
    }

    setDraggedPointId(null);
    setDraggedPointPos(null);
  };

  const getPointDisplayPosition = (point: RoutePreviewPoint): { x: number; y: number } => {
    if (draggedPointId === point.id && draggedPointPos) {
      return {
        x: draggedPointPos.x * 100,
        y: draggedPointPos.y * 100,
      };
    }
    return { x: toSvgPoint(point.x), y: toSvgPoint(point.y) };
  };

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <div className="flex gap-1">
          <button
            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded transition-colors"
            title="Zoom in"
            onClick={handleZoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded transition-colors"
            title="Zoom out"
            onClick={handleZoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded transition-colors"
            title="Fit to screen"
            onClick={handleFitToScreen}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full aspect-video bg-[var(--md-sys-color-surface-variant)] relative overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
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

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
            style={{ cursor: draggedPointId ? 'grabbing' : 'default' }}
          >
            {polyline.length > 0 && (
              <polyline
                points={polyline}
                fill="none"
                stroke="var(--md-sys-color-primary)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {measurementPoints.map((point) => {
              const isSelected = point.id === selectedPointId;
              const isCritical = criticalPointIds.includes(point.id);
              const isDragging = draggedPointId === point.id;
              const displayPos = getPointDisplayPosition(point);

              return (
                <g
                  key={point.id}
                  onMouseDown={(e: React.MouseEvent<SVGGElement>) =>
                    handleSvgMouseDown(e, point.id)
                  }
                  style={{
                    cursor: enablePointDragging ? 'grab' : 'default',
                  }}
                >
                  <circle
                    cx={displayPos.x}
                    cy={displayPos.y}
                    r={isSelected ? 2.8 : 2.2}
                    fill={
                      isSelected
                        ? 'var(--md-sys-color-tertiary)'
                        : isCritical
                          ? '#dc2626'
                          : '#fbbf24'
                    }
                    stroke="var(--md-sys-color-on-surface)"
                    strokeWidth={isDragging ? '0.8' : '0.5'}
                    vectorEffect="non-scaling-stroke"
                    opacity={isDragging ? 0.8 : 1}
                    className={disablePointSelection ? '' : 'cursor-pointer'}
                    onClick={() => {
                      if (!disablePointSelection && onSelectPoint) {
                        onSelectPoint(point.id);
                      }
                    }}
                  />
                  <text
                    x={displayPos.x}
                    y={displayPos.y}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize="2.0"
                    fontWeight="600"
                    fill="var(--md-sys-color-on-surface)"
                    pointerEvents="none"
                    vectorEffect="non-scaling-stroke"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>

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
        </div>

        {!hasOverlayData && !imageUrl && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-[var(--md-sys-color-surface)]/85 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            No route data available.
          </div>
        )}
      </div>
    </div>
  );
}
