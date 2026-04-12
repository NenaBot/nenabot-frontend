import { useMemo, useState } from 'react';
import { clamp, SVG_SIZE } from '../geometry';

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;
const WHEEL_ZOOM_STEP = 0.18;

interface CameraState {
  zoom: number;
  panX: number;
  panY: number;
}

interface PanSession {
  startClientX: number;
  startClientY: number;
  startPanX: number;
  startPanY: number;
}

export interface RoutePreviewCamera {
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  viewBox: string;
  isPanning: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  handleWheel: (event: React.WheelEvent<SVGSVGElement>) => void;
  beginPan: (event: React.MouseEvent<SVGSVGElement>) => void;
  movePan: (event: React.MouseEvent<SVGSVGElement>) => void;
  endPan: () => void;
}

function getViewSize(zoom: number): number {
  return SVG_SIZE / zoom;
}

function getPanBounds(zoom: number): number {
  return SVG_SIZE - getViewSize(zoom);
}

/**
 * Maintains a bounded camera for the SVG scene, where zoom and pan are applied via viewBox.
 */
export function useRoutePreviewCamera(): RoutePreviewCamera {
  const [camera, setCamera] = useState<CameraState>({ zoom: 1, panX: 0, panY: 0 });
  const [panSession, setPanSession] = useState<PanSession | null>(null);

  const setZoom = (nextZoom: number) => {
    setCamera((current) => {
      const boundedZoom = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
      const currentViewSize = getViewSize(current.zoom);
      const nextViewSize = getViewSize(boundedZoom);

      const centerX = current.panX + currentViewSize / 2;
      const centerY = current.panY + currentViewSize / 2;
      const nextPanLimit = getPanBounds(boundedZoom);

      return {
        zoom: boundedZoom,
        panX: clamp(centerX - nextViewSize / 2, 0, nextPanLimit),
        panY: clamp(centerY - nextViewSize / 2, 0, nextPanLimit),
      };
    });
  };

  const viewBox = useMemo(() => {
    const viewSize = getViewSize(camera.zoom);
    return `${camera.panX} ${camera.panY} ${viewSize} ${viewSize}`;
  }, [camera.panX, camera.panY, camera.zoom]);

  const beginPan = (event: React.MouseEvent<SVGSVGElement>) => {
    if (camera.zoom <= ZOOM_MIN || event.button !== 0) {
      return;
    }

    setPanSession({
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPanX: camera.panX,
      startPanY: camera.panY,
    });
  };

  const movePan = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!panSession) {
      return;
    }

    const sceneScale = getViewSize(camera.zoom) / SVG_SIZE;
    const deltaX = (event.clientX - panSession.startClientX) * sceneScale;
    const deltaY = (event.clientY - panSession.startClientY) * sceneScale;
    const panLimit = getPanBounds(camera.zoom);

    setCamera((current) => ({
      ...current,
      panX: clamp(panSession.startPanX - deltaX, 0, panLimit),
      panY: clamp(panSession.startPanY - deltaY, 0, panLimit),
    }));
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const wheelDirection = event.deltaY < 0 ? 1 : -1;
    const wheelFactor = clamp(Math.abs(event.deltaY) / 120, 0.4, 1.25);
    const delta = WHEEL_ZOOM_STEP * wheelFactor * wheelDirection;
    setZoom(camera.zoom + delta);
  };

  return {
    zoom: camera.zoom,
    canZoomIn: camera.zoom < ZOOM_MAX,
    canZoomOut: camera.zoom > ZOOM_MIN,
    viewBox,
    isPanning: panSession !== null,
    zoomIn: () => setZoom(camera.zoom + ZOOM_STEP),
    zoomOut: () => setZoom(camera.zoom - ZOOM_STEP),
    handleWheel,
    beginPan,
    movePan,
    endPan: () => setPanSession(null),
  };
}
