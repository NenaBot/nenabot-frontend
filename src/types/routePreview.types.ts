/**
 * Type definitions for route preview visualization data.
 *
 * Defines interfaces for displaying route previews and preview-related coordinates.
 */
export interface RoutePreviewCoordinate {
  x: number;
  y: number;
}

export interface RoutePreviewPoint extends RoutePreviewCoordinate {
  id: string;
  label: string;
}

export interface RoutePreviewDragResult {
  pointId: string;
  x: number;
  y: number;
}
