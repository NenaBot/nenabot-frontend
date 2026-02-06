import React from 'react';
import { Microscope, Github, HelpCircle, Settings } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--md-sys-color-primary-container)] rounded-lg">
            <Microscope className="w-6 h-6 text-[var(--md-sys-color-on-primary-container)]" />
          </div>
          <div>
            <h1 className="text-3xl text-[var(--md-sys-color-on-surface)]">NenäBot</h1>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Spectrometer Control System v2.1</p>
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
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:shadow-md transition-all text-sm"
            title="View on GitHub"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}