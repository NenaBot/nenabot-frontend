import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="border border-[var(--md-sys-color-outline-variant)]/50 rounded-2xl p-12 bg-[var(--md-sys-color-surface-container-lowest)] shadow-lg">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-tertiary)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-white text-2xl">{icon}</div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-[var(--md-sys-color-on-surface)]">{title}</h3>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-6">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="px-6 py-3 bg-gradient-to-r from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-secondary)] text-white rounded-full hover:shadow-lg transition-all text-sm font-medium hover:scale-105 active:scale-95"
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-6 py-3 border border-[var(--md-sys-color-outline)] rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-all text-sm font-medium active:scale-95"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
