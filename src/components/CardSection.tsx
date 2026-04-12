import React from 'react';

interface CardSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function CardSection({ title, description, children, headerContent }: CardSectionProps) {
  return (
    <section className="group relative border border-[var(--md-sys-color-outline-variant)]/50 rounded-2xl p-6 bg-[var(--md-sys-color-surface-container-lowest)] shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Gradient accent on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-[var(--md-sys-color-primary)] to-transparent pointer-events-none transition-opacity" />

      <div className="relative z-10">
        {(title || headerContent) && (
          <div className="flex items-start justify-between mb-6">
            {title && (
              <div>
                <h3 className="text-lg font-bold mb-1 text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    {description}
                  </p>
                )}
              </div>
            )}
            {headerContent && <div>{headerContent}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
