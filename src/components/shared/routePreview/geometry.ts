import { RoutePreviewCoordinate } from '../../../types/routePreview.types';

export const SVG_SIZE = 100;

/**
 * Converts a normalized unit coordinate [0..1] into the SVG coordinate system [0..100].
 */
export function normalizedToSvg(value: number): number {
  return clamp(value, 0, 1) * SVG_SIZE;
}

/**
 * Converts an SVG coordinate [0..100] into normalized unit coordinate [0..1].
 */
export function svgToNormalized(value: number): number {
  return clamp(value / SVG_SIZE, 0, 1);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isFiniteCoordinate(point: RoutePreviewCoordinate): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

/**
 * Builds the polyline points attribute from normalized coordinates.
 */
export function polylineFromPoints(points: RoutePreviewCoordinate[]): string {
  return points
    .filter(isFiniteCoordinate)
    .map((point) => `${normalizedToSvg(point.x)},${normalizedToSvg(point.y)}`)
    .join(' ');
}

export function screenToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;

  const screenCTM = svg.getScreenCTM();
  if (!screenCTM) {
    return null;
  }

  const local = point.matrixTransform(screenCTM.inverse());
  return {
    x: clamp(local.x, 0, SVG_SIZE),
    y: clamp(local.y, 0, SVG_SIZE),
  };
}
