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
