import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbNavProps {
  activeTab: string;
}

// not really needed. Maybe usefull for later but i removed it for now.

export function BreadcrumbNav({ activeTab }: BreadcrumbNavProps) {
  const tabNames: Record<string, string> = {
    setup: 'Setup Configuration',
    route: 'Route Planning',
    progress: 'Scan Progress',
    results: 'Results & Analysis',
  };

  return (
    <nav className="flex items-center gap-2 text-sm mb-4 text-[var(--md-sys-color-on-surface-variant)] font-medium">
      <Home className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
      <ChevronRight className="w-3 h-3 opacity-50" />
      <span className="text-[var(--md-sys-color-on-surface)]">NenäBot Control Panel</span>
      <ChevronRight className="w-3 h-3 opacity-50" />
      <span className="text-[var(--md-sys-color-primary)] font-bold">
        {tabNames[activeTab] || activeTab}
      </span>
    </nav>
  );
}
