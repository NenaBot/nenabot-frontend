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
      setStreamStatus('disconnected');
      return;
    }

    logCameraStream('Stream URL changed, resetting state', {
      streamUrl,
      retryInterval,
    });
    setStreamSrc(streamUrl);
    setStreamStatus('loading');
  }, [isActive, retryInterval, streamUrl]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    logCameraStream('Stream status updated', {
      streamStatus,
      streamSrc,
      streamUrl,
    });
  }, [streamSrc, streamStatus, streamUrl]);

  useEffect(() => {
    clearTimeout(retryTimeoutRef.current);

    if (!isActive || streamStatus !== 'disconnected' || retryInterval <= 0) {
      return;
    }

    logCameraStream('Scheduling stream reconnect attempt', {
      streamUrl,
      retryInterval,
    });

    retryTimeoutRef.current = window.setTimeout(() => {
      try {
        const url = new URL(streamUrl);
        url.searchParams.set('t', Date.now().toString());
        const retryUrl = url.toString();
        logCameraStream('Applying cache-busted retry URL', {
          streamUrl,
          retryUrl,
        });
        setStreamSrc(retryUrl);
        setStreamStatus('loading');
      } catch (error) {
        logCameraStream('Skipping reconnect because stream URL is invalid', {
          streamUrl,
          error,
        });
        setStreamStatus('error');
      }
    }, retryInterval);

    return () => {
      logCameraStream('Clearing pending reconnect timer', {
        streamUrl,
      });
      clearTimeout(retryTimeoutRef.current);
    };
  }, [isActive, retryInterval, streamStatus, streamUrl]);

  const handleLoad = useCallback(() => {
    if (!isActive) {
      return;
    }

    logCameraStream('Stream image loaded', {
      streamSrc,
      streamUrl,
    });
    setStreamStatus('connected');
  }, [isActive, streamSrc, streamUrl]);

  const handleError = useCallback(() => {
    if (!isActive) {
      return;
    }

    logCameraStream('Stream image errored', {
      streamSrc,
      streamUrl,
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
