import { useState, useEffect, useRef } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface CameraViewProps {
  title?: string;
  showStatus?: boolean;
  height?: 'compact' | 'standard' | 'full';
}

type StreamStatus = 'loading' | 'connected' | 'disconnected' | 'error';

const DEFAULT_RETRY_INTERVAL = 5000; // 5 seconds

export function CameraView({ 
  title = 'Live Camera Feed', 
  showStatus = true,
  height = 'standard'
}: CameraViewProps) {
  const retryInterval = DEFAULT_RETRY_INTERVAL;
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('loading');
  const [streamUrl] = useState(() => apiClient.getVideoStreamUrl());
  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<number | undefined>(undefined);

  const heightMap = {
    compact: 'aspect-video',
    standard: 'aspect-video',
    full: 'h-[600px]'
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setStreamStatus('connected');
      // Clear any pending retry
      clearTimeout(retryTimeoutRef.current);
    };

    const handleError = () => {
      setStreamStatus('disconnected');
      
      // Auto-retry if enabled
      if (retryInterval > 0) {
        retryTimeoutRef.current = window.setTimeout(() => {
          if (img) {
            // Force reload by appending timestamp
            const url = new URL(streamUrl);
            url.searchParams.set('t', Date.now().toString());
            img.src = url.toString();
          }
        }, retryInterval);
      }
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      clearTimeout(retryTimeoutRef.current);
    };
  }, [streamUrl, retryInterval]);

  const getStatusBadge = () => {
    switch (streamStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-(--md-sys-color-primary-container) rounded-full text-xs text-(--md-sys-color-on-primary-container)">
            <div className="w-2 h-2 bg-(--md-sys-color-primary) rounded-full animate-pulse" />
            Live
          </div>
        );
      case 'loading':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-(--md-sys-color-secondary-container) rounded-full text-xs text-(--md-sys-color-on-secondary-container)">
            <div className="w-2 h-2 bg-(--md-sys-color-secondary) rounded-full animate-pulse" />
            Connecting...
          </div>
        );
      case 'disconnected':
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-(--md-sys-color-error-container) rounded-full text-xs text-(--md-sys-color-on-error-container)">
            <AlertCircle className="w-3 h-3" />
            Offline
          </div>
        );
    }
  };

  const showPlaceholder = streamStatus !== 'connected';

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
        <img
          ref={imgRef}
          src={streamUrl}
          alt="Live camera stream"
          className={`w-full h-full object-cover ${showPlaceholder ? 'hidden' : 'block'}`}
        />

        {/* Placeholder - shown when stream unavailable */}
        {showPlaceholder && (
          <div className="absolute inset-0 bg-(--md-sys-color-surface-variant) flex items-center justify-center">
            <div className="text-center p-6">
              <div className={`w-16 h-16 ${streamStatus === 'loading' ? 'bg-(--md-sys-color-secondary-container)' : 'bg-(--md-sys-color-error-container)'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                {streamStatus === 'loading' ? (
                  <Camera className="w-8 h-8 text-(--md-sys-color-on-secondary-container) animate-pulse" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-(--md-sys-color-on-error-container)" />
                )}
              </div>
              <h4 className="text-base font-medium text-(--md-sys-color-on-surface) mb-1">
                {streamStatus === 'loading' ? 'Connecting to Camera' : 'Camera Unavailable'}
              </h4>
              <p className="text-xs text-(--md-sys-color-on-surface-variant)">
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
