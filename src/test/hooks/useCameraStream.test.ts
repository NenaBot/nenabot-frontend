import { act, renderHook } from '@testing-library/react';
import { useCameraStream } from '../../hooks/useCameraStream';

describe('useCameraStream', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-18T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('starts in loading state and handles load/error transitions', () => {
    const { result } = renderHook(() => useCameraStream('http://localhost:8000/stream', 1000));

    expect(result.current.streamStatus).toBe('loading');
    expect(result.current.showPlaceholder).toBe(true);

    act(() => {
      result.current.handleLoad();
    });

    expect(result.current.streamStatus).toBe('connected');
    expect(result.current.showPlaceholder).toBe(false);

    act(() => {
      result.current.handleError();
    });

    expect(result.current.streamStatus).toBe('disconnected');
  });

  test('retries disconnected stream with cache-busting query parameter', () => {
    const { result } = renderHook(() => useCameraStream('http://localhost:8000/stream', 500));

    act(() => {
      result.current.handleError();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.streamStatus).toBe('loading');
    expect(result.current.streamSrc).toContain('http://localhost:8000/stream');
    expect(result.current.streamSrc).toContain('t=');
  });

  test('does not retry when retry interval is non-positive', () => {
    const { result } = renderHook(() => useCameraStream('http://localhost:8000/stream', 0));

    act(() => {
      result.current.handleError();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.streamStatus).toBe('disconnected');
    expect(result.current.streamSrc).toBe('http://localhost:8000/stream');
  });

  test('resets status and src when stream URL changes', () => {
    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => useCameraStream(url, 500),
      {
        initialProps: { url: 'http://localhost:8000/stream-a' },
      },
    );

    act(() => {
      result.current.handleLoad();
    });
    expect(result.current.streamStatus).toBe('connected');

    rerender({ url: 'http://localhost:8000/stream-b' });

    expect(result.current.streamStatus).toBe('loading');
    expect(result.current.streamSrc).toBe('http://localhost:8000/stream-b');
  });
});
