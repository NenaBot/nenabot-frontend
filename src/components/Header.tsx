import { Microscope, Github, HelpCircle, Settings, Sun, Moon } from 'lucide-react';
import { appConfig } from '../config/app.config';
import { useDarkMode } from '../hooks/useDarkMode';

export function Header() {
  const [dark, setDark] = useDarkMode();

  return (
    <header className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-sm theme-transition">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--md-sys-color-primary-container)] rounded-lg">
            <Microscope className="w-6 h-6 text-[var(--md-sys-color-on-primary-container)]" />
          </div>
          <div>
            <h1 className="text-3xl text-[var(--md-sys-color-on-surface)]">{appConfig.name}</h1>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {appConfig.description} v{appConfig.version}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
            title="Help & Documentation"
          >
            <HelpCircle className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
          </button>

          <button
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
            title="System Settings"
          >
            <Settings className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
          </button>

          <button
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <Sun className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
            )}
          </button>

          {appConfig.repository.enabled && (
            <a
              href={appConfig.repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:shadow-md transition-all text-sm"
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
