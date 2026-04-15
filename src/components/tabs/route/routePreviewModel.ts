import { RoutePreviewCoordinate, RoutePreviewPoint } from '../../../types/routePreview.types';

const ROUTE_MATCH_EPSILON = 1e-6;

export interface RoutePreviewBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface DragPreviewPoint {
  pointId: string;
  x: number;
  y: number;
}

export function createDragPreviewPoint(pointId: string, x: number, y: number): DragPreviewPoint {
  return { pointId, x, y };
}

export function normalizedToPixelCoordinate(
  bounds: RoutePreviewBounds,
  normalizedX: number,
  normalizedY: number,
): { x: number; y: number } {
  const spanX = Math.max(bounds.maxX - bounds.minX, 1);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1);

  return {
    x: bounds.minX + normalizedX * spanX,
    y: bounds.minY + normalizedY * spanY,
  };
}

function coordinatesMatch(
  left: { x: number; y: number },
  right: { x: number; y: number },
  epsilon = ROUTE_MATCH_EPSILON,
): boolean {
  return Math.abs(left.x - right.x) < epsilon && Math.abs(left.y - right.y) < epsilon;
}

export function mapPointIdsToRouteIndices(
  points: RoutePreviewPoint[],
  routePath: RoutePreviewCoordinate[],
): Map<string, number> {
  const usedRouteIndices = new Set<number>();
  const pointIdToRouteIndex = new Map<string, number>();

  for (const point of points) {
    const routeIndex = routePath.findIndex(
      (routePoint, index) => !usedRouteIndices.has(index) && coordinatesMatch(routePoint, point),
    );

    if (routeIndex >= 0) {
      pointIdToRouteIndex.set(point.id, routeIndex);
      usedRouteIndices.add(routeIndex);
    }
  }

  return pointIdToRouteIndex;
}

export function applyRouteIndexLabels(
  points: RoutePreviewPoint[],
  routePath: RoutePreviewCoordinate[],
): RoutePreviewPoint[] {
  const pointIdToRouteIndex = mapPointIdsToRouteIndices(points, routePath);

  return points.map((point) => {
    const routeIndex = pointIdToRouteIndex.get(point.id);
    if (routeIndex === undefined) {
      return point;
    }

    return {
      ...point,
      label: String(routeIndex + 1),
    };
  });
}

export function deriveTransientRoutePath(
  routePath: RoutePreviewCoordinate[],
  points: RoutePreviewPoint[],
  dragPreview: DragPreviewPoint | null,
): RoutePreviewCoordinate[] {
  if (!dragPreview) {
    return routePath;
  }

  const pointIdToRouteIndex = mapPointIdsToRouteIndices(points, routePath);
  const draggedRouteIndex = pointIdToRouteIndex.get(dragPreview.pointId);

  if (draggedRouteIndex === undefined) {
    return routePath;
  }

  return routePath.map((point, index) =>
    index === draggedRouteIndex ? { x: dragPreview.x, y: dragPreview.y } : point,
  );
}
