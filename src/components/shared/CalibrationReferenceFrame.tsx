import { useState } from 'react';
import type { CalibrationPoint } from '../../hooks/useCalibration';

interface CalibrationReferenceFrameProps {
  referenceImage: string;
  targetPoint: CalibrationPoint | null;
  capturedPoints: CalibrationPoint[];
}

function toPercent(value: number, size: number): string {
  if (size <= 0) return '0%';
  const percent = Math.min(100, Math.max(0, (value / size) * 100));
  return `${percent}%`;
}

function Marker({
  point,
  imageSize,
  variant,
  fallbackLabel,
}: {
  point: CalibrationPoint;
  imageSize: { width: number; height: number };
  variant: 'target' | 'captured';
  fallbackLabel: string;
}) {
  const isTarget = variant === 'target';
  const colorClass = isTarget ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10';
  const textClass = isTarget ? 'text-red-600' : 'text-green-600';
  const sizeClass = isTarget ? 'w-12 h-12 border-4 animate-pulse' : 'w-8 h-8 border-[3px]';

  return (
    <div
      className={`absolute ${sizeClass} ${colorClass} rounded-full flex items-center justify-center`}
      style={{
        left: toPercent(point.pixelX, imageSize.width),
        top: toPercent(point.pixelY, imageSize.height),
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`absolute inset-1 border-2 ${isTarget ? 'border-red-500' : 'border-green-500'} rounded-full`}
      />
      <span className={`absolute -bottom-6 text-xs font-bold ${textClass} whitespace-nowrap`}>
        {point.label || fallbackLabel}
      </span>
    </div>
  );
}

export function CalibrationReferenceFrame({
  referenceImage,
  targetPoint,
  capturedPoints,
}: CalibrationReferenceFrameProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canPlaceMarkers = imageSize.width > 0 && imageSize.height > 0;

  return (
    <div className="relative bg-black">
      <img
        src={`data:image/jpeg;base64,${referenceImage}`}
        alt="Reference frame"
        className="block w-full h-auto"
        onLoad={(event) => {
          setImageSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          });
        }}
      />

      {canPlaceMarkers ? (
        <div className="absolute inset-0 pointer-events-none">
          {capturedPoints.map((point, index) => (
            <Marker
              key={`${point.step ?? index}-${point.pixelX}-${point.pixelY}`}
              point={point}
              imageSize={imageSize}
              variant="captured"
              fallbackLabel={`P${index + 1}`}
            />
          ))}
          {targetPoint ? (
            <Marker
              point={targetPoint}
              imageSize={imageSize}
              variant="target"
              fallbackLabel="NEXT"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
