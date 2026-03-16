import { useCallback, useEffect, useRef, useState } from 'react';

export type StreamStatus = 'loading' | 'connected' | 'disconnected' | 'error';

export function useCameraStream(streamUrl: string, retryInterval: number) {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('loading');
  const [streamSrc, setStreamSrc] = useState(streamUrl);
  const retryTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setStreamSrc(streamUrl);
    setStreamStatus('loading');
  }, [streamUrl]);

  useEffect(() => {
    clearTimeout(retryTimeoutRef.current);

    if (streamStatus !== 'disconnected' || retryInterval <= 0) {
      return;
    }

    retryTimeoutRef.current = window.setTimeout(() => {
      const url = new URL(streamUrl);
      url.searchParams.set('t', Date.now().toString());
      setStreamSrc(url.toString());
      setStreamStatus('loading');
    }, retryInterval);

    return () => {
      clearTimeout(retryTimeoutRef.current);
    };
  }, [retryInterval, streamStatus, streamUrl]);

  const handleLoad = useCallback(() => {
    setStreamStatus('connected');
  }, []);

  const handleError = useCallback(() => {
    setStreamStatus('disconnected');
  }, []);

  return {
    streamStatus,
    streamSrc,
    showPlaceholder: streamStatus !== 'connected',
    handleLoad,
    handleError,
  };
}
