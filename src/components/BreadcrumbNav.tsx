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
    <nav className="flex items-center gap-2 text-sm mb-4 text-[var(--md-sys-color-on-surface-variant)]">
      <Home className="w-4 h-4" />
      <ChevronRight className="w-4 h-4" />
      <span>NenäBot Control Panel</span>
      <ChevronRight className="w-4 h-4" />
      <span className="text-[var(--md-sys-color-primary)]">{tabNames[activeTab] || activeTab}</span>
    </nav>
  );
}
