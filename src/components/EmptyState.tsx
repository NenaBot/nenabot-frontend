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
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-12 bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="text-[var(--md-sys-color-on-primary-container)]">
            {icon}
          </div>
        </div>
        <h3 className="text-xl mb-2">{title}</h3>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-6">
          {description}
        </p>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full hover:shadow-lg transition-all text-sm"
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-6 py-3 border border-[var(--md-sys-color-outline)] rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-sm"
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
