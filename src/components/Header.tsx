import { useEffect, useRef, useState } from 'react';
import { Microscope, Github, HelpCircle, Settings } from 'lucide-react';
import { appConfig } from '../config/app.config';
import { useDarkMode } from '../hooks/useDarkMode';
import { useMockMode } from '../hooks/useMockMode';

export function Header() {
  const [dark, setDark] = useDarkMode();
  const [mockMode, setMockMode] = useMockMode();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!settingsMenuRef.current?.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSettingsOpen]);

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

          <div className="relative" ref={settingsMenuRef}>
            <button
              className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
              title="System Settings"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              aria-haspopup="dialog"
              aria-expanded={isSettingsOpen}
              aria-controls="settings-panel"
              aria-label="Open settings panel"
            >
              <Settings className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
            </button>
            {isSettingsOpen && (
              <div
                id="settings-panel"
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-2 shadow-lg z-20"
                role="dialog"
                aria-label="Settings panel"
              >
                <label className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg text-sm hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer">
                  <span className="text-[var(--md-sys-color-on-surface)]">Dark Mode</span>
                  <input
                    type="checkbox"
                    checked={dark}
                    onChange={(event) => setDark(event.target.checked)}
                    className="w-4 h-4 accent-[var(--md-sys-color-primary)]"
                    aria-label="Toggle dark mode"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg text-sm hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer">
                  <span className="text-[var(--md-sys-color-on-surface)]">Mock Data</span>
                  <input
                    type="checkbox"
                    checked={mockMode}
                    onChange={(event) => setMockMode(event.target.checked)}
                    className="w-4 h-4 accent-[var(--md-sys-color-primary)]"
                    aria-label="Toggle mock data"
                  />
                </label>
              </div>
            )}
          </div>

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
