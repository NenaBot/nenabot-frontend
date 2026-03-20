import { render, screen, waitFor } from '@testing-library/react';
import { CameraView } from '../CameraView';

// Mock the apiClient
jest.mock('../../services/apiClient', () => ({
  apiClient: {
    getBaseUrl: jest.fn(() => 'http://localhost:8000'),
  },
}));

describe('CameraView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<CameraView />);

    expect(screen.getByText('Live Camera Feed')).toBeInTheDocument();
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  test('renders with custom title', () => {
    render(<CameraView title="Custom Camera" />);

    expect(screen.getByText('Custom Camera')).toBeInTheDocument();
  });

  test('shows placeholder when stream is loading', () => {
    render(<CameraView />);

    expect(screen.getByText('Connecting to Camera')).toBeInTheDocument();
    expect(screen.getByText('Establishing connection to camera stream...')).toBeInTheDocument();
  });

  test('shows offline status when stream fails to load', async () => {
    render(<CameraView />);

    // Simulate image error
    const img = screen.getByAltText('Live camera stream');
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  test('shows live status when stream loads successfully', async () => {
    render(<CameraView />);

    // Simulate image load
    const img = screen.getByAltText('Live camera stream');
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  test('hides status badge when showStatus is false', () => {
    render(<CameraView showStatus={false} />);

    expect(screen.queryByText('Connecting...')).not.toBeInTheDocument();
  });

  test('applies correct height classes', () => {
    const { container } = render(<CameraView height="full" />);

    const cameraContainer = container.querySelector('[class*="h-[600px]"]');
    expect(cameraContainer).toBeInTheDocument();
  });
});
