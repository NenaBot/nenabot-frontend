import { render, screen } from '@testing-library/react';
import { RoutePreviewSvgLayer } from '../../../../components/shared/routePreview/RoutePreviewSvgLayer';

describe('RoutePreviewSvgLayer', () => {
  test('renders border-adjacent points at their true positions', () => {
    const onPointMouseDown = jest.fn();
    const onPointHover = jest.fn();
    const onSelectPoint = jest.fn();
    const onMouseMove = jest.fn();
    const onMouseUp = jest.fn();
    const onMouseDown = jest.fn();
    const onWheel = jest.fn();

    const { container } = render(
      <RoutePreviewSvgLayer
        routePath={[
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ]}
        measurementPoints={[
          { id: 'battery-0-corner-0', label: 'B1C1', x: 0, y: 0 },
          { id: 'measurement-1', label: 'M1', x: 1, y: 1 },
        ]}
        selectedPointId={null}
        criticalPointIds={[]}
        cornerPointIds={['battery-0-corner-0']}
        draggablePointIds={['battery-0-corner-0']}
        disablePointSelection={false}
        enablePointDragging={true}
        viewBox="0 0 100 100"
        draggedPointId={null}
        hoveredPointId={null}
        isPanning={false}
        onPointMouseDown={onPointMouseDown}
        onPointHover={onPointHover}
        onSelectPoint={onSelectPoint}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
        getDisplayPosition={(point) => ({ x: point.x * 100, y: point.y * 100 })}
      />,
    );

    const point = screen.getByLabelText('Point B1C1');
    expect(point).toBeInTheDocument();
    expect(container.querySelector('circle')).toHaveAttribute('cx', '0');
    expect(container.querySelector('circle')).toHaveAttribute('cy', '0');

    const polyline = container.querySelector('polyline[stroke="var(--md-sys-color-primary)"]');
    expect(polyline).not.toBeNull();
    expect(polyline).toHaveAttribute('points', '0,0 100,100');
  });
});
