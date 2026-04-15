import {
  applyRouteIndexLabels,
  createDragPreviewPoint,
  deriveTransientRoutePath,
  mapPointIdsToRouteIndices,
  normalizedToPixelCoordinate,
} from '../routePreviewModel';

describe('routePreviewModel', () => {
  test('maps point ids to unique route indices when coordinates repeat', () => {
    const points = [
      { id: 'battery-0-corner-0', x: 0.5, y: 0.5, label: 'B1C1' },
      { id: 'battery-0-corner-1', x: 0.5, y: 0.5, label: 'B1C2' },
      { id: 'measurement-1', x: 0.2, y: 0.2, label: 'M1' },
    ];

    const routePath = [
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.2, y: 0.2 },
    ];

    const mapping = mapPointIdsToRouteIndices(points, routePath);

    expect(mapping.get('battery-0-corner-0')).toBe(0);
    expect(mapping.get('battery-0-corner-1')).toBe(1);
    expect(mapping.get('measurement-1')).toBe(2);
  });

  test('assigns numeric labels based on route index', () => {
    const points = [
      { id: 'battery-0-corner-0', x: 0.5, y: 0.5, label: 'B1C1' },
      { id: 'battery-0-corner-1', x: 0.5, y: 0.5, label: 'B1C2' },
      { id: 'measurement-1', x: 0.2, y: 0.2, label: 'M1' },
    ];

    const routePath = [
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.2, y: 0.2 },
    ];

    const result = applyRouteIndexLabels(points, routePath);

    expect(result.map((point) => point.label)).toEqual(['1', '2', '3']);
  });

  test('returns unchanged route when drag preview is missing', () => {
    const routePath = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 },
    ];

    const points = [{ id: 'battery-0-corner-0', x: 0.1, y: 0.1, label: 'B1C1' }];

    const result = deriveTransientRoutePath(routePath, points, null);

    expect(result).toEqual(routePath);
  });

  test('updates only mapped route point during drag preview', () => {
    const routePath = [
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.2, y: 0.2 },
    ];

    const points = [
      { id: 'battery-0-corner-0', x: 0.5, y: 0.5, label: 'B1C1' },
      { id: 'battery-0-corner-1', x: 0.5, y: 0.5, label: 'B1C2' },
      { id: 'measurement-1', x: 0.2, y: 0.2, label: 'M1' },
    ];

    const result = deriveTransientRoutePath(routePath, points, {
      pointId: 'battery-0-corner-1',
      x: 0.9,
      y: 0.95,
    });

    expect(result[0]).toEqual({ x: 0.5, y: 0.5 });
    expect(result[1]).toEqual({ x: 0.9, y: 0.95 });
    expect(result[2]).toEqual({ x: 0.2, y: 0.2 });
  });

  test('keeps route unchanged when dragged point has no mapped index', () => {
    const routePath = [{ x: 0.1, y: 0.1 }];
    const points = [{ id: 'battery-0-corner-0', x: 0.1, y: 0.1, label: 'B1C1' }];

    const result = deriveTransientRoutePath(routePath, points, {
      pointId: 'unknown-id',
      x: 0.8,
      y: 0.8,
    });

    expect(result).toEqual(routePath);
  });

  test('converts normalized coordinates to pixel coordinates using bounds', () => {
    const result = normalizedToPixelCoordinate(
      {
        minX: 100,
        maxX: 300,
        minY: 200,
        maxY: 500,
      },
      0.25,
      0.5,
    );

    expect(result).toEqual({ x: 150, y: 350 });
  });

  test('maps normalized bounds edges to pixel bounds', () => {
    const bounds = {
      minX: 10,
      maxX: 30,
      minY: 20,
      maxY: 60,
    };

    expect(normalizedToPixelCoordinate(bounds, 0, 0)).toEqual({ x: 10, y: 20 });
    expect(normalizedToPixelCoordinate(bounds, 1, 1)).toEqual({ x: 30, y: 60 });
  });

  test('uses a minimum span of 1 pixel when bounds collapse', () => {
    const result = normalizedToPixelCoordinate(
      {
        minX: 100,
        maxX: 100,
        minY: 200,
        maxY: 200,
      },
      0.5,
      0.5,
    );

    expect(result).toEqual({ x: 100.5, y: 200.5 });
  });

  test('creates drag preview object', () => {
    expect(createDragPreviewPoint('battery-0-corner-0', 0.4, 0.6)).toEqual({
      pointId: 'battery-0-corner-0',
      x: 0.4,
      y: 0.6,
    });
  });
});
