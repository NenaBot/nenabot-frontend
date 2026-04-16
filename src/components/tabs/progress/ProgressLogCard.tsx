import { ReactNode } from 'react';

interface ProgressLogCardProps {
  title: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

/**
 * Shared card shell for progress tab logs with consistent empty-state treatment.
 */
export function ProgressLogCard({ title, isEmpty, emptyMessage, children }: ProgressLogCardProps) {
  return (
    <section className="border border-(--md-sys-color-outline-variant) rounded-2xl overflow-hidden bg-(--md-sys-color-surface-container-lowest)">
      <div className="px-5 py-3 border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface)">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="p-4 max-h-62.5 overflow-y-auto">
        {isEmpty ? (
          <p className="text-sm italic text-(--md-sys-color-on-surface-variant)">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
