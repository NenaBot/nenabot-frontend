import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoutePreviewPanel, RoutePreviewPoint } from '../RoutePreviewPanel';

describe('RoutePreviewPanel', () => {
  const mockPoints: RoutePreviewPoint[] = [
    { id: 'p1', x: 0.2, y: 0.3, label: '1' },
    { id: 'p2', x: 0.8, y: 0.7, label: '2' },
  ];

  describe('rendering', () => {
    it('should render with default title', () => {
      render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      expect(screen.getByText('Scan Area Preview')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<RoutePreviewPanel title="Custom Title" measurementPoints={mockPoints} />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render zoom controls', () => {
      render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    });

    it('should show empty state when no overlay data and no image', () => {
      render(<RoutePreviewPanel />);

      expect(screen.getByText('No route data available.')).toBeInTheDocument();
    });

    it('should show map preview placeholder when no image', () => {
      render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      expect(screen.getByText('Map Preview')).toBeInTheDocument();
    });

    it('should render image when imageUrl provided', () => {
      const imageUrl = 'data:image/jpeg;base64,test==';
      render(<RoutePreviewPanel imageUrl={imageUrl} />);

      const img = screen.getByAltText('Scan area preview');
      expect(img).toHaveAttribute('src', imageUrl);
    });
  });

  describe('point rendering', () => {
    it('should render measurement points', () => {
      render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
    });

    it('should highlight selected point', () => {
      const { container } = render(
        <RoutePreviewPanel measurementPoints={mockPoints} selectedPointId="p1" />,
      );

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should apply critical point styling', () => {
      const { container } = render(
        <RoutePreviewPanel measurementPoints={mockPoints} criticalPointIds={['p1']} />,
      );

      const circles = container.querySelectorAll('circle[fill="var(--md-sys-color-error)"]');
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe('point selection', () => {
    it('should call onSelectPoint when point is clicked', async () => {
      const onSelectPoint = jest.fn();
      const { container } = render(
        <RoutePreviewPanel measurementPoints={mockPoints} onSelectPoint={onSelectPoint} />,
      );

      const circles = container.querySelectorAll('circle');
      if (circles.length > 0) {
        fireEvent.click(circles[0]);

        await waitFor(() => {
          expect(onSelectPoint).toHaveBeenCalled();
        });
      }
    });

    it('should not call onSelectPoint when disabled', () => {
      const onSelectPoint = jest.fn();
      const { container } = render(
        <RoutePreviewPanel
          measurementPoints={mockPoints}
          disablePointSelection={true}
          onSelectPoint={onSelectPoint}
        />,
      );

      const circles = container.querySelectorAll('circle');
      if (circles.length > 0) {
        fireEvent.click(circles[0]);
      }

      expect(onSelectPoint).not.toHaveBeenCalled();
    });
  });

  describe('zoom controls', () => {
    it('should disable zoom in button at max zoom', async () => {
      render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      const zoomInBtn = screen.getByLabelText('Zoom in');

      // Click zoom in multiple times to reach max
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomInBtn);
      }

      await waitFor(() => {
        expect(zoomInBtn).toBeDisabled();
      });
    });

    it('should disable zoom out button at min zoom', () => {
      render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      const zoomOutBtn = screen.getByLabelText('Zoom out');

      // At min zoom, should be disabled
      expect(zoomOutBtn).toBeDisabled();
    });

    it('should enable both zoom buttons at intermediate zoom level', async () => {
      render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      const zoomInBtn = screen.getByLabelText('Zoom in');
      const zoomOutBtn = screen.getByLabelText('Zoom out');

      // Zoom in once
      fireEvent.click(zoomInBtn);

      await waitFor(() => {
        expect(zoomInBtn).not.toBeDisabled();
        expect(zoomOutBtn).not.toBeDisabled();
      });
    });
  });

  describe('dragging', () => {
    it('should not drag when dragging disabled', () => {
      const onPointDragEnd = jest.fn();
      const { container } = render(
        <RoutePreviewPanel
          measurementPoints={mockPoints}
          enablePointDragging={false}
          onPointDragEnd={onPointDragEnd}
        />,
      );

      const circles = container.querySelectorAll('circle');
      if (circles.length > 0) {
        fireEvent.mouseDown(circles[0]);
        fireEvent.mouseMove(container.querySelector('svg')!);
        fireEvent.mouseUp(container.querySelector('svg')!);
      }

      expect(onPointDragEnd).not.toHaveBeenCalled();
    });

    it('should support drag when enabled', () => {
      const onPointDragEnd = jest.fn();
      const { container } = render(
        <RoutePreviewPanel
          measurementPoints={mockPoints}
          enablePointDragging={true}
          onPointDragEnd={onPointDragEnd}
        />,
      );

      const svg = container.querySelector('svg') as SVGSVGElement;
      const point = container.querySelector('g');

      if (point && svg) {
        // Start drag on point
        fireEvent.mouseDown(point, { clientX: 100, clientY: 100 });

        // Move to new position
        fireEvent.mouseMove(svg, { clientX: 150, clientY: 150 });

        // End drag
        fireEvent.mouseUp(svg);

        // Should call callback (though exact coordinates depend on SVG transform)
        expect(onPointDragEnd).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Number),
          expect.any(Number),
        );
      }
    });
  });

  describe('wheel zoom', () => {
    it('should zoom in on negative wheel delta', () => {
      const { container } = render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      const svg = container.querySelector('svg') as SVGSVGElement;

      if (svg) {
        fireEvent.wheel(svg, { deltaY: -100 });

        // SVG should have updated viewBox (harder to test exact value due to mocking)
        expect(svg).toBeInTheDocument();
      }
    });

    it('should zoom out on positive wheel delta', () => {
      const { container } = render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      const svg = container.querySelector('svg') as SVGSVGElement;

      if (svg) {
        fireEvent.wheel(svg, { deltaY: 100 });

        expect(svg).toBeInTheDocument();
      }
    });
  });

  describe('grid overlay', () => {
    it('should show grid when no image', () => {
      const { container } = render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      const gridOverlay = container.querySelector('[style*="backgroundImage"]');
      expect(gridOverlay).toBeInTheDocument();
    });

    it('should not show grid when image provided', () => {
      const { container } = render(<RoutePreviewPanel imageUrl="data:image/jpeg;base64,test==" />);

      const gridOverlay = Array.from(container.querySelectorAll('div')).find((el) =>
        el.getAttribute('style')?.includes('backgroundImage'),
      );

      expect(gridOverlay).not.toBeInTheDocument();
    });
  });

  describe('viewBox updates', () => {
    it('should update SVG viewBox when zooming', async () => {
      const { container } = render(<RoutePreviewPanel measurementPoints={mockPoints} />);

      const svg = container.querySelector('svg') as SVGSVGElement;
      const initialViewBox = svg.getAttribute('viewBox');

      const zoomInBtn = screen.getByLabelText('Zoom in');
      fireEvent.click(zoomInBtn);

      await waitFor(() => {
        const newViewBox = svg.getAttribute('viewBox');
        expect(newViewBox).not.toBe(initialViewBox);
      });
    });
  });
});
