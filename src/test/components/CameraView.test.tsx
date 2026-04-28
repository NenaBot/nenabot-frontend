import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CameraView } from '../../components/CameraView';

jest.mock('../../services/apiCalls', () => ({
  getStreamUrl: jest.fn(() => 'http://localhost:8000/api/stream/camera/feed'),
}));

const { getStreamUrl } = jest.requireMock('../../services/apiCalls') as {
  getStreamUrl: jest.Mock;
};

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

    const img = screen.getByAltText('Live camera stream');
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  test('shows live status when stream loads successfully', async () => {
    render(<CameraView />);

    const img = screen.getByAltText('Live camera stream');
    fireEvent.load(img);

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

  test('skips stream URL resolution when inactive', () => {
    render(<CameraView isActive={false} />);

    expect(getStreamUrl).not.toHaveBeenCalled();
    expect(screen.queryByAltText('Live camera stream')).not.toBeInTheDocument();
  });

  test('stops rendering stream image when page becomes hidden', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    render(<CameraView />);
    expect(screen.getByAltText('Live camera stream')).toBeInTheDocument();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(screen.queryByAltText('Live camera stream')).not.toBeInTheDocument();
    });

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });
});
