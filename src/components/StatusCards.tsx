import {
  CheckCircle2,
  AlertCircle,
  Activity,
  XCircle,
  Clock,
  WifiOff,
  Database,
  Camera,
  Settings,
} from 'lucide-react';
import { MaterialSymbol } from './MaterialSymbol';
import { HardwareData, HardwareStatus } from '../types/hardware.types';
import { useHardwareData } from '../hooks/useHardwareData';
import { useDarkMode } from '../hooks/useDarkMode';

interface StatusCardProps {
  data: HardwareData;
}

function getStatusIcon(status: HardwareStatus) {
  switch (status) {
    case 'online':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'offline':
      return <WifiOff className="w-4 h-4 text-gray-400" />;
    case 'idle':
      return <Clock className="w-4 h-4 text-blue-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-600" />;
  }
}

function getStatusText(status: HardwareStatus) {
  switch (status) {
    case 'online':
      return 'Connected & Ready';
    case 'warning':
      return 'Warning';
    case 'error':
      return 'Error';
    case 'offline':
      return 'Offline';
    case 'idle':
      return 'Idle';
    default:
      return 'Unknown';
  }
}

function StatusCard({ data }: StatusCardProps) {
  const [dark] = useDarkMode();

  const getHardwareIcon = (type: HardwareData['type']) => {
    const iconProps = {
      className: 'w-6 h-6 font-semibold',
      style: { color: dark ? 'black' : 'white' },
    };

    switch (type) {
      case 'ionvision':
        return <Database {...iconProps} />;
      case 'camera':
        return <Camera {...iconProps} />;
      case 'robot':
        return (
          <MaterialSymbol
            name="precision_manufacturing"
            className="text-2xl font-semibold"
            style={{ color: dark ? 'black' : 'white' }}
          />
        );
      default:
        return <Settings {...iconProps} />;
    }
  };

  return (
    <div className="group relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container-low)] hover:shadow-xl">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-[var(--md-sys-color-primary)] to-transparent pointer-events-none" />

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl pointer-events-none">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            boxShadow: 'var(--glow-primary)',
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {/* Icon container with gradient */}
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-secondary)] shadow-lg group-hover:shadow-xl transition-all">
              {getHardwareIcon(data.type)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-[var(--md-sys-color-on-surface)]">
                  {data.title}
                </span>
                {getStatusIcon(data.status)}
              </div>
              <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
                {getStatusText(data.status)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium">
                {metric.label}
              </span>
              {metric.percentage !== undefined ? (
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden border border-[var(--md-sys-color-outline-variant)]/30">
                    <div
                      className={`h-full rounded-full transition-all duration-500 shadow-lg ${
                        metric.percentage >= 80
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : metric.percentage >= 50
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            : 'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${metric.percentage}%` }}
                    />
                  </div>
                  <span className="text-[var(--md-sys-color-on-surface)] font-bold min-w-12 text-right">
                    {metric.value}
                    {metric.unit}
                  </span>
                </div>
              ) : (
                <span className="text-[var(--md-sys-color-on-surface)] font-bold">
                  {metric.value}
                  {metric.unit}
                </span>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between text-xs border-t border-[var(--md-sys-color-outline-variant)]/30 pt-3 mt-3">
            <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium">
              Device Status
            </span>
            <span
              className={`flex items-center gap-1.5 font-bold px-2 py-1 rounded-full ${
                data.status === 'online'
                  ? 'bg-green-500/20 text-green-600'
                  : data.status === 'warning'
                    ? 'bg-yellow-500/20 text-yellow-600'
                    : data.status === 'error'
                      ? 'bg-red-500/20 text-red-600'
                      : data.status === 'idle'
                        ? 'bg-blue-500/20 text-blue-600'
                        : 'bg-gray-500/20 text-gray-600'
              }`}
            >
              <Activity className="w-3 h-3" />
              {getStatusText(data.status)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 overflow-hidden border border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container-low)]">
      <div className="flex items-start gap-3 mb-4 animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-outline-variant)]" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-28 rounded-lg bg-[var(--md-sys-color-surface-variant)]" />
          <div className="h-3 w-24 rounded-lg bg-[var(--md-sys-color-outline-variant)]" />
        </div>
      </div>
      <div className="space-y-3 animate-pulse">
        <div className="h-3 w-full rounded-lg bg-[var(--md-sys-color-surface-variant)]" />
        <div className="h-3 w-5/6 rounded-lg bg-[var(--md-sys-color-surface-variant)]" />
        <div className="h-3 w-4/6 rounded-lg bg-[var(--md-sys-color-surface-variant)]" />
      </div>
    </div>
  );
}

function StatusCardsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void | Promise<void>;
}) {
  return (
    <div className="border border-[var(--md-sys-color-error)] rounded-2xl p-5 bg-[var(--md-sys-color-error-container)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-[var(--md-sys-color-on-error-container)] mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-error-container)]">
              Hardware status unavailable
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-error-container)] mt-1">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function StatusCards() {
  const { ionvision, camera, robot, isLoading, error, refetch } = useHardwareData();

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusCardSkeleton />
          <StatusCardSkeleton />
          <StatusCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <StatusCardsError message={error.message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ionvision && <StatusCard data={ionvision} />}
        {camera && <StatusCard data={camera} />}
        {robot && <StatusCard data={robot} />}
      </div>
    </div>
  );
}
