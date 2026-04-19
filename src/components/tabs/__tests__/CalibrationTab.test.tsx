import { render, screen, fireEvent } from '@testing-library/react';
import { CalibrationTab } from '../CalibrationTab';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('CalibrationTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      json: async () => ({
        calibration: {
          intrinsicsLoaded: false,
          checkerboardVisible: false,
          calibrated: false,
          lastCalibratedAt: 'Never',
          currentStep: 0,
          totalSteps: 4,
        },
      }),
    });
  });

  test('renders calibration tab with header', () => {
    render(<CalibrationTab />);
    expect(screen.getByText('Robot 4-Point Calibration')).toBeInTheDocument();
  });

  test('displays API URL input field with default value', () => {
    render(<CalibrationTab />);
    const input = screen.getByDisplayValue('http://localhost:8000');
    expect(input).toBeInTheDocument();
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

  test('allows updating API URL', () => {
    render(<CalibrationTab />);
    const input = screen.getByDisplayValue('http://localhost:8000') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'http://192.168.1.100:8000' } });
    expect(input.value).toBe('http://192.168.1.100:8000');
  });

  test('renders with isActive prop', () => {
    render(<CalibrationTab isActive={true} />);
    expect(screen.getByText('Robot 4-Point Calibration')).toBeInTheDocument();
  });

  test('renders controls section', () => {
    render(<CalibrationTab />);
    expect(screen.getByText('API URL')).toBeInTheDocument();
  });
});
