import { render, screen, fireEvent } from '@testing-library/react';
import { RoutePreviewToolbar } from '../RoutePreviewToolbar';

describe('RoutePreviewToolbar', () => {
  const mockProps = {
    title: 'Test Preview',
    canZoomIn: true,
    canZoomOut: true,
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render title', () => {
      render(<RoutePreviewToolbar {...mockProps} />);

      expect(screen.getByText('Test Preview')).toBeInTheDocument();
    });

    it('should render zoom controls', () => {
      render(<RoutePreviewToolbar {...mockProps} />);

      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    });
  });

  describe('zoom in button', () => {
    it('should call onZoomIn when clicked', () => {
      render(<RoutePreviewToolbar {...mockProps} />);

      const zoomInBtn = screen.getByLabelText('Zoom in');
      fireEvent.click(zoomInBtn);

      expect(mockProps.onZoomIn).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when canZoomIn is false', () => {
      render(<RoutePreviewToolbar {...mockProps} canZoomIn={false} />);

      const zoomInBtn = screen.getByLabelText('Zoom in');
      expect(zoomInBtn).toBeDisabled();
    });

    it('should not call onZoomIn when disabled and clicked', () => {
      render(<RoutePreviewToolbar {...mockProps} canZoomIn={false} />);

      const zoomInBtn = screen.getByLabelText('Zoom in');
      fireEvent.click(zoomInBtn);

      expect(mockProps.onZoomIn).not.toHaveBeenCalled();
    });
  });

  describe('zoom out button', () => {
    it('should call onZoomOut when clicked', () => {
      render(<RoutePreviewToolbar {...mockProps} />);

      const zoomOutBtn = screen.getByLabelText('Zoom out');
      fireEvent.click(zoomOutBtn);

      expect(mockProps.onZoomOut).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when canZoomOut is false', () => {
      render(<RoutePreviewToolbar {...mockProps} canZoomOut={false} />);

      const zoomOutBtn = screen.getByLabelText('Zoom out');
      expect(zoomOutBtn).toBeDisabled();
    });

    it('should not call onZoomOut when disabled and clicked', () => {
      render(<RoutePreviewToolbar {...mockProps} canZoomOut={false} />);

      const zoomOutBtn = screen.getByLabelText('Zoom out');
      fireEvent.click(zoomOutBtn);

      expect(mockProps.onZoomOut).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have aria-labels on all buttons', () => {
      render(<RoutePreviewToolbar {...mockProps} />);

      expect(screen.getByLabelText('Zoom in')).toHaveAttribute('aria-label', 'Zoom in');
      expect(screen.getByLabelText('Zoom out')).toHaveAttribute('aria-label', 'Zoom out');
    });

    it('should have type="button" on all buttons', () => {
      render(<RoutePreviewToolbar {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });
  });
});
