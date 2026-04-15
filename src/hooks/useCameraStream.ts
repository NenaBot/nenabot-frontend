import { useCallback, useEffect, useRef, useState } from 'react';

export type StreamStatus = 'loading' | 'connected' | 'disconnected' | 'error';

function logCameraStream(event: string, details: Record<string, unknown>): void {
  console.info('[CameraStream]', event, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}

export function useCameraStream(streamUrl: string, retryInterval: number) {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('loading');
  const [streamSrc, setStreamSrc] = useState(streamUrl);
  const retryTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    logCameraStream('Stream URL changed, resetting state', {
      streamUrl,
      retryInterval,
    });
    setStreamSrc(streamUrl);
    setStreamStatus('loading');
  }, [streamUrl]);

  useEffect(() => {
    logCameraStream('Stream status updated', {
      streamStatus,
      streamSrc,
      streamUrl,
    });
  }, [streamSrc, streamStatus, streamUrl]);

  useEffect(() => {
    clearTimeout(retryTimeoutRef.current);

    if (streamStatus !== 'disconnected' || retryInterval <= 0) {
      return;
    }

    logCameraStream('Scheduling stream reconnect attempt', {
      streamUrl,
      retryInterval,
    });

    retryTimeoutRef.current = window.setTimeout(() => {
      const url = new URL(streamUrl);
      url.searchParams.set('t', Date.now().toString());
      const retryUrl = url.toString();
      logCameraStream('Applying cache-busted retry URL', {
        streamUrl,
        retryUrl,
      });
      setStreamSrc(retryUrl);
      setStreamStatus('loading');
    }, retryInterval);

    return () => {
      logCameraStream('Clearing pending reconnect timer', {
        streamUrl,
      });
      clearTimeout(retryTimeoutRef.current);
    };
  }, [retryInterval, streamStatus, streamUrl]);

  const handleLoad = useCallback(() => {
    logCameraStream('Stream image loaded', {
      streamSrc,
      streamUrl,
    });
    setStreamStatus('connected');
  }, [streamSrc, streamUrl]);

  const handleError = useCallback(() => {
    logCameraStream('Stream image errored', {
      streamSrc,
      streamUrl,
    });
    setStreamStatus('disconnected');
  }, [streamSrc, streamUrl]);

  return {
    streamStatus,
    streamSrc,
    showPlaceholder: streamStatus !== 'connected',
    handleLoad,
    handleError,
  };
}
