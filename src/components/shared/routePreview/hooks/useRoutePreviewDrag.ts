import { useState } from 'react';
import { normalizedToSvg, screenToSvgPoint, svgToNormalized } from '../geometry';
import { RoutePreviewPoint } from '../../../../types/routePreview.types';

interface DragState {
  pointId: string | null;
  x: number | null;
  y: number | null;
}

export interface RoutePreviewDragModel {
  draggedPointId: string | null;
  isDragging: boolean;
  hoveredPointId: string | null;
  beginDrag: (pointId: string, event: React.MouseEvent<SVGGElement>) => void;
  updateDrag: (event: React.MouseEvent<SVGSVGElement>) => void;
  completeDrag: () => void;
  cancelDrag: () => void;
  setHoveredPointId: (pointId: string | null) => void;
  getDisplayPosition: (point: RoutePreviewPoint) => { x: number; y: number };
}

/**
 * Stores active drag state in normalized units [0..1] and commits once on drag end.
 */
export function useRoutePreviewDrag(
  enabled: boolean,
  onDragMove?: (pointId: string, x: number, y: number) => void,
  onDragEnd?: (pointId: string, x: number, y: number) => void,
): RoutePreviewDragModel {
  const [dragState, setDragState] = useState<DragState>({
    pointId: null,
    x: null,
    y: null,
  });
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  const beginDrag = (pointId: string, event: React.MouseEvent<SVGGElement>) => {
    if (!enabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setDragState({ pointId, x: null, y: null });
  };

  const updateDrag = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!enabled || !dragState.pointId) {
      return;
    }

    const svgPoint = screenToSvgPoint(event.currentTarget, event.clientX, event.clientY);
    if (!svgPoint) {
      return;
    }

    setDragState({
      pointId: dragState.pointId,
      x: svgToNormalized(svgPoint.x),
      y: svgToNormalized(svgPoint.y),
    });

    if (onDragMove) {
      onDragMove(dragState.pointId, svgToNormalized(svgPoint.x), svgToNormalized(svgPoint.y));
    }
  };

  const completeDrag = () => {
    if (enabled && dragState.pointId && dragState.x !== null && dragState.y !== null && onDragEnd) {
      onDragEnd(dragState.pointId, dragState.x, dragState.y);
    }

    setDragState({ pointId: null, x: null, y: null });
  };

  const getDisplayPosition = (point: RoutePreviewPoint): { x: number; y: number } => {
    if (dragState.pointId === point.id && dragState.x !== null && dragState.y !== null) {
      return {
        x: normalizedToSvg(dragState.x),
        y: normalizedToSvg(dragState.y),
      };
    }

    return {
      x: normalizedToSvg(point.x),
      y: normalizedToSvg(point.y),
    };
  };

  return {
    draggedPointId: dragState.pointId,
    isDragging: dragState.pointId !== null,
    hoveredPointId,
    beginDrag,
    updateDrag,
    completeDrag,
    cancelDrag: () => setDragState({ pointId: null, x: null, y: null }),
    setHoveredPointId,
    getDisplayPosition,
  };
}
