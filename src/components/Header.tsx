import { Microscope, Github, HelpCircle, Settings } from 'lucide-react';
import { appConfig } from '../config/app.config';

export function Header() {
  return (
    <header className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface) shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--md-sys-color-primary-container) rounded-lg">
            <Microscope className="w-6 h-6 text-(--md-sys-color-on-primary-container)" />
          </div>
          <div>
            <h1 className="text-3xl text-(--md-sys-color-on-surface)">{appConfig.name}</h1>
            <p className="text-xs text-(--md-sys-color-on-surface-variant)">{appConfig.description} v{appConfig.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-full hover:bg-(--md-sys-color-surface-variant) transition-colors"
            title="Help & Documentation"
          >
            <HelpCircle className="w-5 h-5 text-(--md-sys-color-on-surface-variant)" />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-(--md-sys-color-surface-variant) transition-colors"
            title="System Settings"
          >
            <Settings className="w-5 h-5 text-(--md-sys-color-on-surface-variant)" />
          </button>
          {appConfig.repository.enabled && (
            <a 
              href={appConfig.repository.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-(--md-sys-color-secondary-container) text-(--md-sys-color-on-secondary-container) hover:shadow-md transition-all text-sm"
              title="View on GitHub"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}