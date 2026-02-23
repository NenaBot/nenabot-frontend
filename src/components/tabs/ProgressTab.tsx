import { useEffect } from 'react';
import { Square, Pause, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { CameraView } from '../CameraView';

interface ProgressTabProps {
  onNext?: () => void;
}

export function ProgressTab({ onNext }: ProgressTabProps) {
  const events = [
    { id: 1, time: '14:32:15', type: 'info', message: 'Scan started successfully' },
    { id: 2, time: '14:32:18', type: 'success', message: 'Spectrometer initialized' },
    { id: 3, time: '14:32:20', type: 'success', message: 'Calibration verified' },
    { id: 4, time: '14:32:25', type: 'info', message: 'Starting route navigation' },
    { id: 5, time: '14:32:30', type: 'info', message: 'Data collection in progress' },
  ];

  const measurements = [
    { id: 1, point: 'A-001', wavelength: '450nm', intensity: 0.87, status: 'complete' },
    { id: 2, point: 'A-002', wavelength: '475nm', intensity: 0.92, status: 'complete' },
    { id: 3, point: 'A-003', wavelength: '500nm', intensity: 0.79, status: 'complete' },
    { id: 4, point: 'A-004', wavelength: '525nm', intensity: 0.85, status: 'processing' },
  ];

  const scanProgress: number = 34; // TODO: Connect to actual scan progress from API

  useEffect(() => {
    // Auto-advance to results when scan completes
    if (scanProgress === 100 && onNext) {
      const timer = setTimeout(onNext, 1000); // 1s delay for visual feedback
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [scanProgress, onNext]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Scan Progress</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Monitor live status, events, and recent measurements during the scan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Status and Controls */}
        <div className="lg:col-span-1 space-y-6">
        {/* Current Status */}
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Scan Status</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>In Progress</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Progress</span>
              <span className="text-[var(--md-sys-color-on-surface)] font-medium">847 / 2500 points</span>
            </div>
            <div className="w-full h-2 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{scanProgress}% complete</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg">
              <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">Elapsed</div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">4m 12s</span>
              </div>
            </div>
            <div className="p-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg">
              <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">Remaining</div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">~8m 15s</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--md-sys-color-surface-variant)] transition-all text-sm">
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button className="flex-1 px-4 py-2.5 bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all text-sm">
              <Square className="w-4 h-4 fill-current" />
              Abort
            </button>
          </div>
        </div>

        {/* Event List */}
        <section className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
            <h3 className="text-sm font-medium">Event Log</h3>
          </div>
          <div className="p-4 max-h-62.5 overflow-y-auto">
            <div className="space-y-2">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
                >
                  {event.type === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  )}
                  {event.type === 'info' && (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 mt-0.5 shrink-0" />
                  )}
                  {event.type === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                      {event.time}
                    </div>
                    <div className="text-sm text-[var(--md-sys-color-on-surface)]">
                      {event.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Measurements List */}
        <section className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
            <h3 className="text-sm font-medium">Recent Measurements</h3>
          </div>
          <div className="p-4 max-h-62.5 overflow-y-auto">
            <div className="space-y-2">
              {measurements.map((measurement) => (
                <div 
                  key={measurement.id}
                  className="p-3 border border-[var(--md-sys-color-outline-variant)] rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{measurement.point}</span>
                    {measurement.status === 'complete' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">λ: </span>
                      <span className="text-[var(--md-sys-color-on-surface)]">{measurement.wavelength}</span>
                    </div>
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">I: </span>
                      <span className="text-[var(--md-sys-color-on-surface)]">{measurement.intensity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </div>

        {/* Right Panel - Live Camera Feed */}
        <div className="lg:col-span-2">
          <CameraView title="Live Camera Feed" showStatus={true} height="full" />
        </div>
      </div>
    </div>
  );
}