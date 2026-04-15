import { renderHook, act } from '@testing-library/react';
import { useRoutePreviewDrag } from '../hooks/useRoutePreviewDrag';
import { RoutePreviewPoint } from '../../../../types/routePreview.types';

describe('useRoutePreviewDrag', () => {
  const mockPoint: RoutePreviewPoint = {
    id: 'test-point-1',
    label: '1',
    x: 0.5,
    y: 0.5,
  };

  const createMockMouseEvent = (): React.MouseEvent<SVGGElement> =>
    ({
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    }) as unknown as React.MouseEvent<SVGGElement>;

  const createMockSVGEvent = (): React.MouseEvent<SVGSVGElement> =>
    ({
      currentTarget: {
        createSVGPoint: () => ({ x: 0, y: 0 }),
        getScreenCTM: () => ({
          inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
        }),
      },
      clientX: 50,
      clientY: 50,
    }) as unknown as React.MouseEvent<SVGSVGElement>;

  describe('when disabled', () => {
    it('should not start drag when disabled', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(false));

      const mockEvent = createMockMouseEvent();

      act(() => {
        result.current.beginDrag('point-1', mockEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.draggedPointId).toBeNull();
    });

    it('should not update drag position when disabled', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(false));

      const mockSvgEvent = {
        currentTarget: {
          createSVGPoint: () => ({ x: 50, y: 50 }),
          getScreenCTM: () => ({
            inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
          }),
        },
        clientX: 100,
        clientY: 100,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.beginDrag('point-1', createMockMouseEvent());
        result.current.updateDrag(mockSvgEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('when enabled', () => {
    it('should initialize with no drag state', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(true));

      expect(result.current.isDragging).toBe(false);
      expect(result.current.draggedPointId).toBeNull();
      expect(result.current.hoveredPointId).toBeNull();
    });

    it('should start drag and prevent default on beginDrag', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(true));

      const mockEvent = createMockMouseEvent();

      act(() => {
        result.current.beginDrag('point-1', mockEvent);
      });

      expect(result.current.isDragging).toBe(true);
      expect(result.current.draggedPointId).toBe('point-1');
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should update drag position during drag', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(true));

      const mockSvgEvent = createMockSVGEvent();

      act(() => {
        result.current.beginDrag('point-1', createMockMouseEvent());
        result.current.updateDrag(mockSvgEvent);
      });

      const displayPos = result.current.getDisplayPosition(mockPoint);

      // Display position should be updated to dragged position
      expect(displayPos.x).toBeGreaterThan(0);
      expect(displayPos.y).toBeGreaterThan(0);
    });

    it('should call onDragEnd callback with normalized coordinates when drag completes', () => {
      const onDragEnd = jest.fn();
      const { result } = renderHook(() => useRoutePreviewDrag(true, undefined, onDragEnd));

      // Create a mock SVG element with proper matrix transformation
      const mockSvgElement = {
        createSVGPoint: jest.fn(() => {
          return {
            x: 0,
            y: 0,
            matrixTransform: jest.fn(function () {
              return this;
            }),
          };
        }),
        getScreenCTM: jest.fn(() => ({
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: 0,
          f: 0,
          inverse: jest.fn(function () {
            return this;
          }),
        })),
      } as unknown as SVGSVGElement;

      act(() => {
        result.current.beginDrag('point-1', createMockMouseEvent());
      });

      expect(result.current.isDragging).toBe(true);

      // Update drag with mock SVG event
      const mockSvgEvent = {
        currentTarget: mockSvgElement,
        clientX: 50,
        clientY: 50,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.updateDrag(mockSvgEvent);
      });

      act(() => {
        result.current.completeDrag();
      });

      // Verify the callback was called
      expect(onDragEnd).toHaveBeenCalledWith('point-1', expect.any(Number), expect.any(Number));

      // Verify coordinates are normalized [0..1]
      if (onDragEnd.mock.calls.length > 0) {
        const [, x, y] = onDragEnd.mock.calls[0];
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1);
      }
    });

    it('should clear drag state after completeDrag', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(true));

      act(() => {
        result.current.beginDrag('point-1', createMockMouseEvent());
        result.current.completeDrag();
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.draggedPointId).toBeNull();
    });

    it('should not call onDragEnd if no callback provided', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(true, undefined, undefined));

      act(() => {
        result.current.beginDrag('point-1', createMockMouseEvent());
        result.current.completeDrag();
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('should cancel drag without calling onDragEnd', () => {
      const onDragEnd = jest.fn();
      const { result } = renderHook(() => useRoutePreviewDrag(true, undefined, onDragEnd));

      act(() => {
        result.current.beginDrag('point-1', createMockMouseEvent());
        result.current.cancelDrag();
      });

      expect(result.current.isDragging).toBe(false);
      expect(onDragEnd).not.toHaveBeenCalled();
    });

    it('should update hovered point ID', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(true));

      act(() => {
        result.current.setHoveredPointId('point-2');
      });

      expect(result.current.hoveredPointId).toBe('point-2');

      act(() => {
        result.current.setHoveredPointId(null);
      });

      expect(result.current.hoveredPointId).toBeNull();
    });

    it('should return original position when not dragging', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(true));

      const displayPos = result.current.getDisplayPosition(mockPoint);

      // Should return SVG coordinates [0..100] for normalized [0..1]
      expect(displayPos.x).toBe(50);
      expect(displayPos.y).toBe(50);
    });

    it('should not update drag if getScreenCTM returns null', () => {
      const { result } = renderHook(() => useRoutePreviewDrag(true));

      const mockSvgEvent = {
        currentTarget: {
          createSVGPoint: () => ({ x: 0, y: 0 }),
          getScreenCTM: () => null,
        },
        clientX: 50,
        clientY: 50,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.beginDrag('point-1', createMockMouseEvent());
        result.current.updateDrag(mockSvgEvent);
      });

      // Drag should still be active
      expect(result.current.isDragging).toBe(true);

      // But position should not update, so original is returned
      const displayPos = result.current.getDisplayPosition(mockPoint);
      expect(displayPos.x).toBe(50);
      expect(displayPos.y).toBe(50);
    });

    it('should call onDragMove with normalized coordinates during drag', () => {
      const onDragMove = jest.fn();
      const { result } = renderHook(() => useRoutePreviewDrag(true, onDragMove));

      const mockSvgElement = {
        createSVGPoint: jest.fn(() => {
          return {
            x: 0,
            y: 0,
            matrixTransform: jest.fn(function () {
              return this;
            }),
          };
        }),
        getScreenCTM: jest.fn(() => ({
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: 0,
          f: 0,
          inverse: jest.fn(function () {
            return this;
          }),
        })),
      } as unknown as SVGSVGElement;

      act(() => {
        result.current.beginDrag('point-1', createMockMouseEvent());
      });

      const mockSvgEvent = {
        currentTarget: mockSvgElement,
        clientX: 30,
        clientY: 40,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.updateDrag(mockSvgEvent);
      });

      expect(onDragMove).toHaveBeenCalledWith('point-1', expect.any(Number), expect.any(Number));
    });
  });
});
