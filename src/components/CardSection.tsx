import React from 'react';

interface CardSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function CardSection({
  title,
  description,
  children,
  headerContent,
}: CardSectionProps) {
  return (
    <section className="border border-(--md-sys-color-outline-variant) rounded-2xl p-6 bg-(--md-sys-color-surface-container-lowest)">
      {(title || headerContent) && (
        <div className="flex items-start justify-between mb-5">
          {title && (
            <div>
              <h3 className="text-lg mb-1">{title}</h3>
              {description && (
                <p className="text-sm text-(--md-sys-color-on-surface-variant)">
                  {description}
                </p>
              )}
            </div>
          )}
          {headerContent && <div>{headerContent}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
