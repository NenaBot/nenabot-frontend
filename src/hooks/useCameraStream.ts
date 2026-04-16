import { useCallback, useEffect, useRef, useState } from 'react';

export type StreamStatus = 'loading' | 'connected' | 'disconnected' | 'error';

function logCameraStream(event: string, details: Record<string, unknown>): void {
  console.info('[CameraStream]', event, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}

export function useCameraStream(streamUrl: string, retryInterval: number, isActive = true) {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(
    isActive ? 'loading' : 'disconnected',
  );
  const [streamSrc, setStreamSrc] = useState(streamUrl);
  const retryTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isActive) {
      clearTimeout(retryTimeoutRef.current);
      logCameraStream('Stream unsubscribed', {
        streamUrl,
        reason: 'inactive',
      });
      setStreamStatus('disconnected');
      return;
    }

    logCameraStream('Stream subscribed', {
      streamUrl,
      retryInterval,
    });
    setStreamSrc(streamUrl);
    setStreamStatus('loading');
  }, [isActive, retryInterval, streamUrl]);

  useEffect(() => {
    clearTimeout(retryTimeoutRef.current);

    if (!isActive || streamStatus !== 'disconnected' || retryInterval <= 0) {
      return;
    }

    retryTimeoutRef.current = window.setTimeout(() => {
      try {
        const url = new URL(streamUrl);
        url.searchParams.set('t', Date.now().toString());
        const retryUrl = url.toString();
        setStreamSrc(retryUrl);
        setStreamStatus('loading');
      } catch (error) {
        logCameraStream('Stream error', {
          streamUrl,
          error: error instanceof Error ? error.message : String(error),
        });
        setStreamStatus('error');
      }
    }, retryInterval);

    return () => {
      clearTimeout(retryTimeoutRef.current);
    };
  }, [isActive, retryInterval, streamStatus, streamUrl]);

  const handleLoad = useCallback(() => {
    if (!isActive) {
      return;
    }

    setStreamStatus('connected');
  }, [isActive]);

  const handleError = useCallback(() => {
    if (!isActive) {
      return;
    }

    logCameraStream('Stream error', {
      streamSrc,
      streamUrl,
      reason: 'image-error',
    });
    setStreamStatus('disconnected');
  }, [isActive, streamSrc, streamUrl]);

  return {
    streamStatus,
    streamSrc,
    showPlaceholder: streamStatus !== 'connected',
    handleLoad,
    handleError,
  };
}
