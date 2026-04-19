import { Settings, MapPin, Activity, BarChart3, Camera, Crosshair } from 'lucide-react';
import { TabId } from '../types/tab.types';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: Array<{
  id: TabId;
  label: string;
  icon: typeof Settings;
  description: string;
}> = [
  { id: 'setup', label: 'Setup', icon: Settings, description: 'Configure scan parameters' },
  { id: 'camera', label: 'Camera', icon: Camera, description: 'Verify camera and detection' },
  { id: 'calibration', label: 'Calibration', icon: Crosshair, description: 'Robot 4-point calibration' },
  { id: 'route', label: 'Route', icon: MapPin, description: 'Plan scan route' },
  { id: 'progress', label: 'Progress', icon: Activity, description: 'Monitor live scanning' },
  { id: 'results', label: 'Results', icon: BarChart3, description: 'View analysis' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="sticky top-16 z-40 border-b border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface)] backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap group ${
                  isActive
                    ? 'text-[var(--md-sys-color-primary)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
                title={tab.description}
              >
                <Icon
                  className={`w-4 h-4 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                <span>{tab.label}</span>

                {/* Active indicator with glow effect */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-secondary)] rounded-full shadow-lg" />
                )}

                {/* Hover effect background */}
                {!isActive && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-[var(--md-sys-color-primary)] rounded transition-opacity pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Decorative bottom glow */}
        <div className="h-1 bg-gradient-to-r from-[var(--md-sys-color-primary)]/0 via-[var(--md-sys-color-primary)]/10 to-[var(--md-sys-color-primary)]/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
