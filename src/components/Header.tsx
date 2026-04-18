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
    <header className="sticky top-0 z-50 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-lg theme-transition relative overflow-visible">
      {/* Gradient background accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--md-sys-color-primary)]/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Logo with glow effect */}
          <div className="p-2.5 bg-gradient-to-br from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-secondary)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Microscope className="w-6 h-6 font-semibold" style={{ color: dark ? 'black' : 'white' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">
              {appConfig.name}
            </h1>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
              {appConfig.description} <span className="opacity-60">v{appConfig.version}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-all duration-200 hover:scale-110 active:scale-95"
            title="Help & Documentation"
          >
            <HelpCircle className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
          </button>

          <div className="relative" ref={settingsMenuRef}>
            <button
              className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-all duration-200 hover:scale-110 active:scale-95"
              title="System Settings"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              aria-expanded={isSettingsOpen}
              aria-controls="settings-panel"
              aria-label="Open settings panel"
            >
              <Settings className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
            </button>
            {isSettingsOpen && (
              <div
                id="settings-panel"
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] backdrop-blur-sm p-3 shadow-xl z-50 border-opacity-50"
                aria-label="Settings panel"
              >
                <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer transition-all duration-200">
                  <span className="text-[var(--md-sys-color-on-surface)] font-medium">
                    Dark Mode
                  </span>
                  <input
                    type="checkbox"
                    checked={dark}
                    onChange={(event) => setDark(event.target.checked)}
                    className="w-4 h-4 accent-[var(--md-sys-color-primary)] cursor-pointer"
                    aria-label="Toggle dark mode"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer transition-all duration-200">
                  <span className="text-[var(--md-sys-color-on-surface)] font-medium">
                    Mock Data
                  </span>
                  <input
                    type="checkbox"
                    checked={mockMode}
                    onChange={(event) => setMockMode(event.target.checked)}
                    className="w-4 h-4 accent-[var(--md-sys-color-primary)] cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-secondary)] hover:shadow-lg transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95"
              style={{ color: dark ? 'black' : 'white' }}
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
