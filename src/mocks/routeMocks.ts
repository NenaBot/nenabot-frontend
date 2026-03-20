import { RoutePreviewCoordinate, RoutePreviewPoint } from '../types/routePreview.types';

export interface DefaultRoutePreviewData {
  waypoints: RoutePreviewPoint[];
  routePath: RoutePreviewCoordinate[];
}

// Default waypoints and serpentine route shown before detection runs.
export const DEFAULT_ROUTE_PREVIEW: DefaultRoutePreviewData = {
  waypoints: [
    { id: 'wp-1', label: '1', x: 0.15, y: 0.2 },
    { id: 'wp-2', label: '2', x: 0.5, y: 0.2 },
    { id: 'wp-3', label: '3', x: 0.85, y: 0.2 },
    { id: 'wp-4', label: '4', x: 0.85, y: 0.5 },
    { id: 'wp-5', label: '5', x: 0.5, y: 0.5 },
    { id: 'wp-6', label: '6', x: 0.15, y: 0.5 },
    { id: 'wp-7', label: '7', x: 0.15, y: 0.8 },
    { id: 'wp-8', label: '8', x: 0.5, y: 0.8 },
    { id: 'wp-9', label: '9', x: 0.85, y: 0.8 },
  ],
  routePath: [
    { x: 0.15, y: 0.2 },
    { x: 0.5, y: 0.2 },
    { x: 0.85, y: 0.2 },
    { x: 0.85, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.15, y: 0.5 },
    { x: 0.15, y: 0.8 },
    { x: 0.5, y: 0.8 },
    { x: 0.85, y: 0.8 },
  ],
};
