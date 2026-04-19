import { render, screen, fireEvent } from '@testing-library/react';
import { CalibrationTab } from '../CalibrationTab';
import { apiClient } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CalibrationTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue({
      calibration: {
        intrinsicsLoaded: false,
        checkerboardVisible: false,
        calibrated: false,
        lastCalibratedAt: 'Never',
        currentStep: 0,
        totalSteps: 4,
      },
    });
  });

  test('renders calibration tab with header', () => {
    render(<CalibrationTab />);
    expect(screen.getByText('Robot 4-Point Calibration')).toBeInTheDocument();
  });

  test('displays status labels', () => {
    render(<CalibrationTab />);
    expect(screen.getByText('Intrinsics')).toBeInTheDocument();
    expect(screen.getByText('Checkerboard')).toBeInTheDocument();
    expect(screen.getByText('Runtime Calibration')).toBeInTheDocument();
    expect(screen.getByText('Last Calibrated')).toBeInTheDocument();
  });

  test('renders Start Calibration button', () => {
    render(<CalibrationTab />);
    const startBtn = screen.getByRole('button', { name: /start calibration/i });
    expect(startBtn).toBeInTheDocument();
  });

  test('renders Refresh Status button', () => {
    render(<CalibrationTab />);
    const refreshBtn = screen.getByRole('button', { name: /refresh status/i });
    expect(refreshBtn).toBeInTheDocument();
  });

  test('renders Capture Current Point button', () => {
    render(<CalibrationTab />);
    const captureBtn = screen.getByRole('button', { name: /capture current point/i });
    expect(captureBtn).toBeInTheDocument();
  });

  test('displays progress indicator', () => {
    render(<CalibrationTab />);
    expect(screen.getByText(/step/i)).toBeInTheDocument();
  });

  test('displays initial message', () => {
    render(<CalibrationTab />);
    expect(
      screen.getByText(/press start calibration once the checkerboard is visible/i),
    ).toBeInTheDocument();
  });

  test('renders video feed labels', () => {
    render(<CalibrationTab />);
    expect(screen.getByText('Raw Stream')).toBeInTheDocument();
    expect(screen.getByText('Detection Stream')).toBeInTheDocument();
  });

  test('renders reference frame label', () => {
    render(<CalibrationTab />);
    expect(screen.getByText('Reference Frame')).toBeInTheDocument();
  });

  test('allows clicking Refresh Status button', () => {
    render(<CalibrationTab />);
    const refreshBtn = screen.getByRole('button', { name: /refresh status/i });
    fireEvent.click(refreshBtn);
    expect(refreshBtn).toBeInTheDocument();
  });

  test('allows clicking Start Calibration button', () => {
    render(<CalibrationTab />);
    const startBtn = screen.getByRole('button', { name: /start calibration/i });
    fireEvent.click(startBtn);
    expect(startBtn).toBeInTheDocument();
  });
});
