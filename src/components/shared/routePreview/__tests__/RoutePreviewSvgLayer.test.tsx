import { render, fireEvent } from '@testing-library/react';
import { RoutePreviewSvgLayer } from '../RoutePreviewSvgLayer';
import { RoutePreviewPoint, RoutePreviewCoordinate } from '../../../../types/routePreview.types';

describe('RoutePreviewSvgLayer', () => {
  const mockPoints: RoutePreviewPoint[] = [
    { id: 'p1', x: 0.2, y: 0.3, label: '1' },
    { id: 'p2', x: 0.8, y: 0.7, label: '2' },
  ];

  const mockRoute: RoutePreviewCoordinate[] = [
    { x: 0.2, y: 0.3 },
    { x: 0.8, y: 0.7 },
  ];

  const mockProps = {
    routePath: mockRoute,
    measurementPoints: mockPoints,
    selectedPointId: null,
    criticalPointIds: [],
    cornerPointIds: ['p1'],
    draggablePointIds: ['p1'],
    disablePointSelection: false,
    enablePointDragging: false,
    viewBox: '0 0 100 100',
    draggedPointId: null,
    hoveredPointId: null,
    isPanning: false,
    onPointMouseDown: jest.fn(),
    onPointHover: jest.fn(),
    onSelectPoint: jest.fn(),
    onMouseMove: jest.fn(),
    onMouseUp: jest.fn(),
    onMouseDown: jest.fn(),
    onWheel: jest.fn(),
    getDisplayPosition: (point: RoutePreviewPoint) => ({ x: point.x * 100, y: point.y * 100 }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render SVG with correct viewBox', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    });

    it('should render polyline when route path provided', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const polyline = container.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
    });

    it('should not render polyline when no route path and no points', () => {
      const { container } = render(
        <RoutePreviewSvgLayer {...mockProps} routePath={[]} measurementPoints={[]} />,
      );

      const polyline = container.querySelector('polyline');
      expect(polyline).not.toBeInTheDocument();
    });

    it('should render measurement points', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(mockPoints.length);
    });
  });

  describe('point labels', () => {
    it('should show labels for selected points', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} selectedPointId="p1" />);

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBeGreaterThan(0);
    });

    it('should show labels for hovered points', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} hoveredPointId="p1" />);

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBeGreaterThan(0);
    });

    it('should show labels for dragged points', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} draggedPointId="p1" />);

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBeGreaterThan(0);
    });

    it('should not show labels when point is not selected, hovered, or dragged', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBe(0);
    });
  });

  describe('point styling', () => {
    it('should apply tertiary color to selected points', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} selectedPointId="p1" />);

      const selectedCircle = container.querySelector('circle[fill="var(--md-sys-color-tertiary)"]');
      expect(selectedCircle).toBeInTheDocument();
    });

    it('should apply error color to critical points', () => {
      const { container } = render(
        <RoutePreviewSvgLayer {...mockProps} criticalPointIds={['p1']} />,
      );

      const criticalCircle = container.querySelector('circle[fill="var(--md-sys-color-error)"]');
      expect(criticalCircle).toBeInTheDocument();
    });

    it('should apply secondary color to normal points', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const normalCircles = container.querySelectorAll(
        'circle[fill="var(--md-sys-color-secondary)"]',
      );
      expect(normalCircles.length).toBeGreaterThan(0);
    });

    it('should increase stroke width for dragged points', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} draggedPointId="p1" />);

      const draggedCircle = container.querySelector('circle[stroke-width="0.8"]');
      expect(draggedCircle).toBeInTheDocument();
    });
  });

  describe('point interactions', () => {
    it('should call onPointMouseDown when point is clicked down', () => {
      const { container } = render(
        <RoutePreviewSvgLayer {...mockProps} enablePointDragging={true} />,
      );

      const pointGroups = container.querySelectorAll('g');
      if (pointGroups.length > 0) {
        fireEvent.mouseDown(pointGroups[0]);

        expect(mockProps.onPointMouseDown).toHaveBeenCalled();
      }
    });

    it('should not call onPointMouseDown for non-draggable points', () => {
      const { container } = render(
        <RoutePreviewSvgLayer {...mockProps} enablePointDragging={true} />,
      );

      const pointGroups = container.querySelectorAll('g');
      if (pointGroups.length > 1) {
        fireEvent.mouseDown(pointGroups[1]);

        expect(mockProps.onPointMouseDown).not.toHaveBeenCalled();
      }
    });

    it('should call onPointHover when mouse enters point', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const pointGroups = container.querySelectorAll('g');
      if (pointGroups.length > 0) {
        fireEvent.mouseEnter(pointGroups[0]);

        expect(mockProps.onPointHover).toHaveBeenCalledWith('p1');
      }
    });

    it('should call onPointHover with null when mouse leaves point', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const pointGroups = container.querySelectorAll('g');
      if (pointGroups.length > 0) {
        fireEvent.mouseLeave(pointGroups[0]);

        expect(mockProps.onPointHover).toHaveBeenCalledWith(null);
      }
    });

    it('should call onSelectPoint when point is clicked', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const circles = container.querySelectorAll('circle');
      if (circles.length > 0) {
        fireEvent.click(circles[0]);

        expect(mockProps.onSelectPoint).toHaveBeenCalledWith('p1');
      }
    });

    it('should not call onSelectPoint when selection disabled', () => {
      const { container } = render(
        <RoutePreviewSvgLayer {...mockProps} disablePointSelection={true} />,
      );

      const circles = container.querySelectorAll('circle');
      if (circles.length > 0) {
        fireEvent.click(circles[0]);

        expect(mockProps.onSelectPoint).not.toHaveBeenCalled();
      }
    });
  });

  describe('svg events', () => {
    it('should call onMouseMove when SVG receives mousemove', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const svg = container.querySelector('svg');
      if (svg) {
        fireEvent.mouseMove(svg);

        expect(mockProps.onMouseMove).toHaveBeenCalled();
      }
    });

    it('should call onMouseUp when SVG receives mouseup', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const svg = container.querySelector('svg');
      if (svg) {
        fireEvent.mouseUp(svg);

        expect(mockProps.onMouseUp).toHaveBeenCalled();
      }
    });

    it('should call onMouseDown when SVG receives mousedown', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const svg = container.querySelector('svg');
      if (svg) {
        fireEvent.mouseDown(svg);

        expect(mockProps.onMouseDown).toHaveBeenCalled();
      }
    });

    it('should call onWheel when SVG receives wheel event', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const svg = container.querySelector('svg');
      if (svg) {
        fireEvent.wheel(svg, { deltaY: 100 });

        expect(mockProps.onWheel).toHaveBeenCalled();
      }
    });
  });

  describe('cursor state', () => {
    it('should show grabbing cursor when dragging', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} draggedPointId="p1" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveStyle('cursor: grabbing');
    });

    it('should show grabbing cursor when panning', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} isPanning={true} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveStyle('cursor: grabbing');
    });

    it('should show default cursor otherwise', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveStyle('cursor: default');
    });
  });

  describe('viewBox', () => {
    it('should use provided viewBox', () => {
      const customViewBox = '10 20 80 80';
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} viewBox={customViewBox} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', customViewBox);
    });
  });

  describe('polyline rendering source', () => {
    it('should render polyline from routePath ordering', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} />);

      const polyline = container.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
      expect(polyline).toHaveAttribute('points', '20,30 80,70');
    });

    it('should not render polyline when routePath is empty', () => {
      const { container } = render(<RoutePreviewSvgLayer {...mockProps} routePath={[]} />);

      const polyline = container.querySelector('polyline');
      expect(polyline).not.toBeInTheDocument();
    });
  });
});
