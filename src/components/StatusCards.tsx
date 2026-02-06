import React from 'react';
import { Camera, CheckCircle2, AlertCircle, Activity } from 'lucide-react';

export function StatusCards() {
  return (
    <div className="mb-6">
      <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 bg-[var(--md-sys-color-surface-container-low)] hover:shadow-md transition-all max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-primary-container)]">
              <Camera className="w-5 h-5 text-[var(--md-sys-color-on-primary-container)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-[var(--md-sys-color-on-surface)]">
                  Spectrometer
                </span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                Connected & Ready
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--md-sys-color-on-surface-variant)]">Last Reading</span>
            <span className="text-[var(--md-sys-color-on-surface)]">2.1s ago</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--md-sys-color-on-surface-variant)]">Signal Strength</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full transition-all"
                  style={{ width: '97%' }}
                />
              </div>
              <span className="text-[var(--md-sys-color-on-surface)]">97%</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--md-sys-color-on-surface-variant)]">Device Status</span>
            <span className="text-green-600 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}