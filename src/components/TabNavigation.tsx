import { Settings, MapPin, Activity, BarChart3, Camera } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'setup', label: 'Setup', icon: Settings, description: 'Configure scan parameters' },
    { id: 'camera', label: 'Camera', icon: Camera, description: 'Verify camera and detection' },
    { id: 'route', label: 'Route', icon: MapPin, description: 'Plan scan route' },
    { id: 'progress', label: 'Progress', icon: Activity, description: 'Monitor live scanning' },
    { id: 'results', label: 'Results', icon: BarChart3, description: 'View analysis' },
  ];

  return (
    <div className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 text-sm relative transition-all group ${
              activeTab === tab.id
                ? 'text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]'
            }`}
            title={tab.description}
          >
            <div className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--md-sys-color-primary)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}