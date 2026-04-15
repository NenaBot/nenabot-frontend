import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouteTab } from '../RouteTab';
import { useRoutePlan } from '../../../hooks/useRoutePlan';
import { ProfileModel } from '../../../types/profile.types';
import { MEASUREMENT_DENSITY_MAX } from '../../../types/route.types';
import { mapPointIdsToRouteIndices } from '../route/routePreviewModel';
import { RoutePreviewPanel } from '../../shared/RoutePreviewPanel';

jest.mock('../../shared/RoutePreviewPanel', () => ({
  RoutePreviewPanel: jest.fn(() => <div data-testid="route-preview" />),
}));

jest.mock('../../../hooks/useRoutePlan', () => ({
  useRoutePlan: jest.fn(),
}));

const selectedProfile: ProfileModel = {
  name: 'default-profile',
  description: 'test profile',
  settings: {
    workZ: 10,
    workR: 20,
    options: {},
  },
};

describe('RouteTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getPreviewProps = () => {
    const mock = RoutePreviewPanel as jest.Mock;
    return mock.mock.calls[mock.mock.calls.length - 1]?.[0];
  };

  test('allows starting a corners-only route when measurement density is zero', async () => {
    const createScanJob = jest.fn().mockResolvedValue('job-corners-only');

    (useRoutePlan as jest.Mock).mockReturnValue({
      state: {
        measurementDensity: 0,
        dryRun: false,
        isInitializing: false,
        isPopulating: false,
        isCreatingJob: false,
        imageBase64: null,
        routeError: null,
        cornerPoints: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        measurementPoints: [],
        populatedPath: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        populatedPathWithMetadata: [],
        batteries: [],
      },
      preview: {
        routePath: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        points: [],
        cornerPointIds: ['battery-0-corner-0'],
        draggablePointIds: ['battery-0-corner-0'],
        bounds: {
          minX: 0,
          maxX: 10,
          minY: 0,
          maxY: 10,
        },
      },
      setDryRun: jest.fn(),
      setMeasurementDensity: jest.fn(),
      moveCornerPoint: jest.fn(),
      resetRoutePlan: jest.fn(),
      createScanJob,
    });

    const onJobCreated = jest.fn();

    render(<RouteTab selectedProfile={selectedProfile} onJobCreated={onJobCreated} />);

    const startButton = screen.getByRole('button', { name: 'Start Scan Job' });
    expect(startButton).not.toBeDisabled();
    expect(screen.getByText('Checked waypoints: 4')).toBeInTheDocument();

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(createScanJob).toHaveBeenCalledTimes(1);
      expect(onJobCreated).toHaveBeenCalledWith('job-corners-only');
    });
  });

  test('allows starting when route path exists with low non-zero density and zero measurements', async () => {
    const createScanJob = jest.fn().mockResolvedValue('job-low-density');

    (useRoutePlan as jest.Mock).mockReturnValue({
      state: {
        measurementDensity: 0.1,
        dryRun: false,
        isInitializing: false,
        isPopulating: false,
        isCreatingJob: false,
        imageBase64: null,
        routeError: null,
        cornerPoints: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        measurementPoints: [],
        populatedPath: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        populatedPathWithMetadata: [],
        batteries: [{ corners: [{ x: 0, y: 0 }] }],
      },
      preview: {
        routePath: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        points: [],
        cornerPointIds: ['battery-0-corner-0'],
        draggablePointIds: ['battery-0-corner-0'],
        bounds: {
          minX: 0,
          maxX: 10,
          minY: 0,
          maxY: 10,
        },
      },
      setDryRun: jest.fn(),
      setMeasurementDensity: jest.fn(),
      moveCornerPoint: jest.fn(),
      resetRoutePlan: jest.fn(),
      createScanJob,
    });

    const onJobCreated = jest.fn();

    render(<RouteTab selectedProfile={selectedProfile} onJobCreated={onJobCreated} />);

    const startButton = screen.getByRole('button', { name: 'Start Scan Job' });
    expect(startButton).not.toBeDisabled();
    expect(screen.getByText('Checked waypoints: 4')).toBeInTheDocument();

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(createScanJob).toHaveBeenCalledTimes(1);
      expect(onJobCreated).toHaveBeenCalledWith('job-low-density');
    });
  });

  test('rejects measurement density values above the maximum with validation error', async () => {
    const setMeasurementDensity = jest.fn();

    (useRoutePlan as jest.Mock).mockReturnValue({
      state: {
        measurementDensity: 0,
        dryRun: false,
        isInitializing: false,
        isPopulating: false,
        isCreatingJob: false,
        imageBase64: null,
        routeError: null,
        cornerPoints: [],
        measurementPoints: [],
        populatedPath: [],
        populatedPathWithMetadata: [],
        batteries: [],
      },
      preview: {
        routePath: [],
        points: [],
        cornerPointIds: [],
        draggablePointIds: [],
        bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
      },
      setDryRun: jest.fn(),
      setMeasurementDensity,
      moveCornerPoint: jest.fn(),
      resetRoutePlan: jest.fn(),
      createScanJob: jest.fn(),
    });

    const onJobCreated = jest.fn();
    render(<RouteTab selectedProfile={selectedProfile} onJobCreated={onJobCreated} />);

    const input = screen.getByRole('spinbutton', { name: /measurement density/i });
    fireEvent.change(input, { target: { value: '42' } });

    // Verify validation error is displayed
    const errorText = screen.getByText(
      new RegExp(`Enter a value between 0 and ${MEASUREMENT_DENSITY_MAX}\\.`, 'i'),
    );
    expect(errorText).toBeInTheDocument();

    // Verify setMeasurementDensity was NOT called (invalid value rejected)
    expect(setMeasurementDensity).not.toHaveBeenCalled();

    const populateButton = screen.getByRole('button', { name: 'Populate Path' });
    expect(populateButton).toBeDisabled();
  });

  test('disables Populate Path while route is populating', () => {
    (useRoutePlan as jest.Mock).mockReturnValue({
      state: {
        measurementDensity: 0.5,
        dryRun: false,
        isInitializing: false,
        isPopulating: true,
        isCreatingJob: false,
        imageBase64: null,
        routeError: null,
        cornerPoints: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        measurementPoints: [],
        populatedPath: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        populatedPathWithMetadata: [],
        batteries: [{ corners: [{ x: 0, y: 0 }] }],
      },
      preview: {
        routePath: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        points: [],
        cornerPointIds: ['battery-0-corner-0'],
        draggablePointIds: ['battery-0-corner-0'],
        bounds: {
          minX: 0,
          maxX: 10,
          minY: 0,
          maxY: 10,
        },
      },
      setDryRun: jest.fn(),
      setMeasurementDensity: jest.fn(),
      moveCornerPoint: jest.fn(),
      resetRoutePlan: jest.fn(),
      createScanJob: jest.fn(),
    });

    render(<RouteTab selectedProfile={selectedProfile} onJobCreated={jest.fn()} />);

    const populateButton = screen.getByRole('button', { name: 'Populate Path' });
    expect(populateButton).toBeDisabled();
  });

  test('applies measurement density only when Populate Path is clicked', () => {
    const setMeasurementDensity = jest.fn();

    (useRoutePlan as jest.Mock).mockReturnValue({
      state: {
        measurementDensity: 0.5,
        dryRun: false,
        isInitializing: false,
        isPopulating: false,
        isCreatingJob: false,
        imageBase64: null,
        routeError: null,
        cornerPoints: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        measurementPoints: [],
        populatedPath: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        populatedPathWithMetadata: [],
        batteries: [{ corners: [{ x: 0, y: 0 }] }],
      },
      preview: {
        routePath: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        points: [],
        cornerPointIds: ['battery-0-corner-0'],
        draggablePointIds: ['battery-0-corner-0'],
        bounds: {
          minX: 0,
          maxX: 10,
          minY: 0,
          maxY: 10,
        },
      },
      setDryRun: jest.fn(),
      setMeasurementDensity,
      moveCornerPoint: jest.fn(),
      resetRoutePlan: jest.fn(),
      createScanJob: jest.fn(),
    });

    render(<RouteTab selectedProfile={selectedProfile} onJobCreated={jest.fn()} />);

    const input = screen.getByRole('spinbutton', { name: /measurement density/i });
    fireEvent.change(input, { target: { value: '1.7' } });

    expect(setMeasurementDensity).not.toHaveBeenCalled();

    const populateButton = screen.getByRole('button', { name: 'Populate Path' });
    fireEvent.click(populateButton);

    expect(setMeasurementDensity).toHaveBeenCalledWith(1.7);
  });

  test('maps point ids to unique route indices when coordinates repeat', () => {
    const points = [
      { id: 'battery-0-corner-0', x: 0.5, y: 0.5 },
      { id: 'battery-0-corner-1', x: 0.5, y: 0.5 },
      { id: 'measurement-1', x: 0.2, y: 0.2 },
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

  test('skips point ids that have no route coordinate match', () => {
    const points = [{ id: 'battery-0-corner-0', x: 0.8, y: 0.8 }];
    const routePath = [{ x: 0.1, y: 0.1 }];

    const mapping = mapPointIdsToRouteIndices(points, routePath);

    expect(mapping.has('battery-0-corner-0')).toBe(false);
  });

  test('updates preview route path during drag move', async () => {
    const moveCornerPoint = jest.fn();

    (useRoutePlan as jest.Mock).mockReturnValue({
      state: {
        measurementDensity: 0.5,
        dryRun: false,
        isInitializing: false,
        isPopulating: false,
        isCreatingJob: false,
        imageBase64: null,
        routeError: null,
        cornerPoints: [
          { x: 100, y: 50 },
          { x: 200, y: 150 },
        ],
        measurementPoints: [],
        populatedPath: [
          { x: 100, y: 50 },
          { x: 200, y: 150 },
        ],
        populatedPathWithMetadata: [],
        batteries: [
          {
            corners: [
              { x: 100, y: 50 },
              { x: 200, y: 150 },
            ],
          },
        ],
      },
      preview: {
        routePath: [
          { x: 0.1, y: 0.2 },
          { x: 0.4, y: 0.6 },
        ],
        points: [
          { id: 'battery-0-corner-0', x: 0.1, y: 0.2, label: 'B1C1' },
          { id: 'battery-0-corner-1', x: 0.4, y: 0.6, label: 'B1C2' },
        ],
        cornerPointIds: ['battery-0-corner-0', 'battery-0-corner-1'],
        draggablePointIds: ['battery-0-corner-0', 'battery-0-corner-1'],
        bounds: {
          minX: 100,
          maxX: 200,
          minY: 50,
          maxY: 150,
        },
      },
      setDryRun: jest.fn(),
      setMeasurementDensity: jest.fn(),
      moveCornerPoint,
      resetRoutePlan: jest.fn(),
      createScanJob: jest.fn(),
    });

    render(<RouteTab selectedProfile={selectedProfile} onJobCreated={jest.fn()} />);

    const previewProps = getPreviewProps();
    previewProps.onPointDragMove('battery-0-corner-1', 0.9, 0.1);

    await waitFor(() => {
      const latestProps = getPreviewProps();
      expect(latestProps.routePath).toEqual([
        { x: 0.1, y: 0.2 },
        { x: 0.9, y: 0.1 },
      ]);
    });
  });

  test('commits drag end using pixel bounds', () => {
    const moveCornerPoint = jest.fn();

    (useRoutePlan as jest.Mock).mockReturnValue({
      state: {
        measurementDensity: 0.5,
        dryRun: false,
        isInitializing: false,
        isPopulating: false,
        isCreatingJob: false,
        imageBase64: null,
        routeError: null,
        cornerPoints: [
          { x: 100, y: 50 },
          { x: 200, y: 150 },
        ],
        measurementPoints: [],
        populatedPath: [
          { x: 100, y: 50 },
          { x: 200, y: 150 },
        ],
        populatedPathWithMetadata: [],
        batteries: [
          {
            corners: [
              { x: 100, y: 50 },
              { x: 200, y: 150 },
            ],
          },
        ],
      },
      preview: {
        routePath: [
          { x: 0.1, y: 0.2 },
          { x: 0.4, y: 0.6 },
        ],
        points: [
          { id: 'battery-0-corner-0', x: 0.1, y: 0.2, label: 'B1C1' },
          { id: 'battery-0-corner-1', x: 0.4, y: 0.6, label: 'B1C2' },
        ],
        cornerPointIds: ['battery-0-corner-0', 'battery-0-corner-1'],
        draggablePointIds: ['battery-0-corner-0', 'battery-0-corner-1'],
        bounds: {
          minX: 100,
          maxX: 200,
          minY: 50,
          maxY: 150,
        },
      },
      setDryRun: jest.fn(),
      setMeasurementDensity: jest.fn(),
      moveCornerPoint,
      resetRoutePlan: jest.fn(),
      createScanJob: jest.fn(),
    });

    render(<RouteTab selectedProfile={selectedProfile} onJobCreated={jest.fn()} />);

    const previewProps = getPreviewProps();
    previewProps.onPointDragEnd('battery-0-corner-1', 0.25, 0.5);

    expect(moveCornerPoint).toHaveBeenCalledWith('battery-0-corner-1', 125, 100);
  });
});
