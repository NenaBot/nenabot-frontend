import { renderHook, act } from '@testing-library/react';
import { useRoutePreviewCamera } from '../hooks/useRoutePreviewCamera';

describe('useRoutePreviewCamera', () => {
  describe('initialization', () => {
    it('should initialize with zoom level 1', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      expect(result.current.zoom).toBe(1);
      expect(result.current.viewBox).toBe('0 0 100 100');
      expect(result.current.isPanning).toBe(false);
    });

    it('should initialize with canZoomIn true and canZoomOut false', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      expect(result.current.canZoomIn).toBe(true);
      expect(result.current.canZoomOut).toBe(false);
    });
  });

  describe('zoom controls', () => {
    it('should increase zoom on zoomIn', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      const initialZoom = result.current.zoom;

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.zoom).toBeGreaterThan(initialZoom);
    });

    it('should decrease zoom on zoomOut', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      act(() => {
        result.current.zoomIn();
      });

      const zoomedLevel = result.current.zoom;

      act(() => {
        result.current.zoomOut();
      });

      expect(result.current.zoom).toBeLessThan(zoomedLevel);
    });

    it('should not zoom out below ZOOM_MIN', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      expect(result.current.zoom).toBe(1);
      expect(result.current.canZoomOut).toBe(false);

      act(() => {
        result.current.zoomOut();
      });

      expect(result.current.zoom).toBe(1);
    });

    it('should update canZoomIn based on zoom level', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      expect(result.current.canZoomIn).toBe(true);

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.canZoomIn).toBe(true);
    });

    it('should update canZoomOut on zoom level changes', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      expect(result.current.canZoomOut).toBe(false);

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.canZoomOut).toBe(true);
    });

    it('should approach but not exceed ZOOM_MAX', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      // Zoom in 8 times: 1 + (8 * 0.25) = 3
      act(() => {
        result.current.zoomIn();
      });
      act(() => {
        result.current.zoomIn();
      });
      act(() => {
        result.current.zoomIn();
      });
      act(() => {
        result.current.zoomIn();
      });
      act(() => {
        result.current.zoomIn();
      });
      act(() => {
        result.current.zoomIn();
      });
      act(() => {
        result.current.zoomIn();
      });
      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.zoom).toBe(3);
      expect(result.current.canZoomIn).toBe(false);

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.zoom).toBe(3);
    });
  });

  describe('viewBox updates', () => {
    it('should update viewBox when zoom changes', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      const initialViewBox = result.current.viewBox;

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.viewBox).not.toBe(initialViewBox);
    });

    it('should maintain full bounds at zoom level 1', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      expect(result.current.viewBox).toBe('0 0 100 100');
    });
  });

  describe('pan controls', () => {
    it('should not allow panning when zoom is 1', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      const mockEvent = {
        clientX: 100,
        clientY: 100,
        button: 0,
      } as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.beginPan(mockEvent);
      });

      expect(result.current.isPanning).toBe(false);
    });

    it('should start pan session when zoomed in with left click', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      act(() => {
        result.current.zoomIn();
      });

      const mockEvent = {
        clientX: 100,
        clientY: 100,
        button: 0,
      } as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.beginPan(mockEvent);
      });

      expect(result.current.isPanning).toBe(true);
    });

    it('should not pan with right mouse button', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      act(() => {
        result.current.zoomIn();
      });

      const rightClickEvent = {
        clientX: 100,
        clientY: 100,
        button: 2,
      } as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.beginPan(rightClickEvent);
      });

      expect(result.current.isPanning).toBe(false);
    });

    it('should end pan session', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      act(() => {
        result.current.zoomIn();
      });

      act(() => {
        result.current.beginPan({
          clientX: 100,
          clientY: 100,
          button: 0,
        } as React.MouseEvent<SVGSVGElement>);
      });

      expect(result.current.isPanning).toBe(true);

      act(() => {
        result.current.endPan();
      });

      expect(result.current.isPanning).toBe(false);
    });

    it('should update camera position during pan', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      act(() => {
        result.current.zoomIn();
      });

      const initialViewBox = result.current.viewBox;

      act(() => {
        result.current.beginPan({
          clientX: 50,
          clientY: 50,
          button: 0,
        } as React.MouseEvent<SVGSVGElement>);
      });

      act(() => {
        result.current.movePan({
          clientX: 150,
          clientY: 150,
        } as React.MouseEvent<SVGSVGElement>);
      });

      expect(result.current.viewBox).not.toBe(initialViewBox);
    });
  });

  describe('wheel zoom', () => {
    it('should zoom in on negative wheel delta', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      const initialZoom = result.current.zoom;

      act(() => {
        const wheelEvent = {
          deltaY: -100,
          preventDefault: jest.fn(),
        } as unknown as React.WheelEvent<SVGSVGElement>;

        result.current.handleWheel(wheelEvent);
      });

      expect(result.current.zoom).toBeGreaterThan(initialZoom);
    });

    it('should zoom out on positive wheel delta', () => {
      const { result } = renderHook(() => useRoutePreviewCamera());

      act(() => {
        result.current.zoomIn();
      });

      const zoomedLevel = result.current.zoom;

      act(() => {
        const wheelEvent = {
          deltaY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.WheelEvent<SVGSVGElement>;

        result.current.handleWheel(wheelEvent);
      });

      expect(result.current.zoom).toBeLessThan(zoomedLevel);
    });
  });
});
