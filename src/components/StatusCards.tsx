import { CheckCircle2, AlertCircle, Activity, XCircle, Clock, WifiOff } from 'lucide-react';
import { MaterialSymbol } from './MaterialSymbol';
import { HardwareData, HardwareStatus } from '../types/hardware.types';
import { useHardwareData } from '../hooks/useHardwareData';

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

function getStatusColor(status: HardwareStatus) {
  switch (status) {
    case 'online':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    case 'offline':
      return 'text-gray-400';
    case 'idle':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

function getHardwareIcon(type: HardwareData['type']) {
  const className = "text-xl text-[var(--md-sys-color-on-primary-container)]";
  
  switch (type) {
    case 'spectrometer':
      return <MaterialSymbol name="lab_research" className={className} />;
    case 'camera':
      return <MaterialSymbol name="photo_camera" className={className} />;
    case 'robotarm':
      return <MaterialSymbol name="precision_manufacturing" className={className} />;
    default:
      return <MaterialSymbol name="settings" className={className} />;
  }
}

function StatusCard({ data }: StatusCardProps) {
  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 bg-[var(--md-sys-color-surface-container-low)] hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--md-sys-color-primary-container)] to-[var(--md-sys-color-surface-container-highest)]">
            {getHardwareIcon(data.type)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg text-[var(--md-sys-color-on-surface)]">
                {data.title}
              </span>
              {getStatusIcon(data.status)}
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {getStatusText(data.status)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {data.metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-[var(--md-sys-color-on-surface-variant)]">{metric.label}</span>
            {metric.percentage !== undefined ? (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      metric.percentage >= 80 ? 'bg-green-600' : 
                      metric.percentage >= 50 ? 'bg-yellow-600' : 
                      'bg-red-600'
                    }`}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
                <span className="text-[var(--md-sys-color-on-surface)]">
                  {metric.value}{metric.unit}
                </span>
              </div>
            ) : (
              <span className="text-[var(--md-sys-color-on-surface)]">
                {metric.value}{metric.unit}
              </span>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between text-xs border-t border-[var(--md-sys-color-outline-variant)] pt-2 mt-2">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Device Status</span>
          <span className={`flex items-center gap-1 ${getStatusColor(data.status)}`}>
            <Activity className="w-3 h-3" />
            {getStatusText(data.status)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatusCards() {
  const { spectrometer, camera, robotarm } = useHardwareData();

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spectrometer && <StatusCard data={spectrometer} />}
        {camera && <StatusCard data={camera} />}
        {robotarm && <StatusCard data={robotarm} />}
      </div>
    </div>
  );
}