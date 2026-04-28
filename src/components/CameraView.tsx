import { Camera, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getStreamUrl } from '../services/apiCalls';
import { useCameraStream } from '../hooks/useCameraStream';

interface CameraViewProps {
  title?: string;
  showStatus?: boolean;
  height?: 'compact' | 'standard' | 'full';
  streamKind?: 'camera' | 'detection';
  isActive?: boolean;
}

const DEFAULT_RETRY_INTERVAL = 5000; // 5 seconds

export function CameraView({
  title = 'Live Camera Feed',
  showStatus = true,
  height = 'standard',
  streamKind = 'camera',
  isActive = true,
}: CameraViewProps) {
  const [isPageVisible, setIsPageVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );
  const imageRef = useRef<HTMLImageElement | null>(null);
  const shouldStream = isActive && isPageVisible;
  const retryInterval = DEFAULT_RETRY_INTERVAL;
  const streamUrl = shouldStream ? getStreamUrl(streamKind) : '';
  const { streamStatus, streamSrc, showPlaceholder, handleLoad, handleError } = useCameraStream(
    streamUrl,
    retryInterval,
    shouldStream,
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!shouldStream && imageRef.current) {
      imageRef.current.src = '';
    }

    return () => {
      if (imageRef.current) {
        imageRef.current.src = '';
      }
    };
  }, [shouldStream]);

  useEffect(() => {
    if (!shouldStream) {
      return;
    }

    console.info('[CameraView] Rendered camera view', {
      timestamp: new Date().toISOString(),
      title,
      streamKind,
      streamUrl,
      streamStatus,
      streamSrc,
      isActive,
      isPageVisible,
      shouldStream,
    });
  }, [
    isActive,
    isPageVisible,
    shouldStream,
    streamKind,
    streamSrc,
    streamStatus,
    streamUrl,
    title,
  ]);

  const onImageLoad = () => {
    handleLoad();
  };

  const onImageError = () => {
    console.error('[CameraView] img onError fired', {
      timestamp: new Date().toISOString(),
      streamKind,
      streamSrc,
      streamStatus,
    });
    handleError();
  };

  const heightMap = {
    compact: 'aspect-video',
    standard: 'aspect-video',
    full: 'h-[600px]',
  };

  const getStatusBadge = () => {
    switch (streamStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--md-sys-color-primary-container)] rounded-full text-xs text-[var(--md-sys-color-on-primary-container)]">
            <div className="w-2 h-2 bg-[var(--md-sys-color-primary)] rounded-full animate-pulse" />
            Live
          </div>
        );
      case 'loading':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--md-sys-color-secondary-container)] rounded-full text-xs text-[var(--md-sys-color-on-secondary-container)]">
            <div className="w-2 h-2 bg-[var(--md-sys-color-secondary)] rounded-full animate-pulse" />
            Connecting...
          </div>
        );
      case 'disconnected':
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--md-sys-color-error-container)] rounded-full text-xs text-[var(--md-sys-color-on-error-container)]">
            <AlertCircle className="w-3 h-3" />
            Offline
          </div>
        );
    }
  };

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <h3 className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{title}</h3>
        </div>
        {showStatus && getStatusBadge()}
      </div>

      {/* Camera Feed / Placeholder */}
      <div className={`${heightMap[height]} w-full relative overflow-hidden`}>
        {/* MJPEG Stream */}
        {shouldStream && (
          <img
            ref={imageRef}
            src={streamSrc}
            alt="Live camera stream"
            className={`w-full h-full object-cover ${showPlaceholder ? 'hidden' : 'block'}`}
            onLoad={onImageLoad}
            onError={onImageError}
          />
        )}

        {/* Placeholder - shown when stream unavailable */}
        {showPlaceholder && (
          <div className="absolute inset-0 bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center">
            <div className="text-center p-6">
              <div
                className={`w-16 h-16 ${streamStatus === 'loading' ? 'bg-[var(--md-sys-color-secondary-container)]' : 'bg-[var(--md-sys-color-error-container)]'} rounded-full flex items-center justify-center mx-auto mb-3`}
              >
                {streamStatus === 'loading' ? (
                  <Camera className="w-8 h-8 text-[var(--md-sys-color-on-secondary-container)] animate-pulse" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-[var(--md-sys-color-on-error-container)]" />
                )}
              </div>
              <h4 className="text-base font-medium text-[var(--md-sys-color-on-surface)] mb-1">
                {streamStatus === 'loading' ? 'Connecting to Camera' : 'Camera Unavailable'}
              </h4>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                {streamStatus === 'loading'
                  ? 'Establishing connection to camera stream...'
                  : retryInterval > 0
                    ? `Retrying connection every ${retryInterval / 1000}s`
                    : 'Unable to connect to camera stream'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
