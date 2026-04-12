import React from 'react';
import { Info } from 'lucide-react';

interface FormFieldProps {
  label: string;
  tooltip?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export function FormField({
  label,
  tooltip,
  helpText,
  required = false,
  disabled = false,
  children,
}: FormFieldProps) {
  return (
    <div className="group">
      <label className="flex items-center gap-2 text-sm mb-2.5 text-[var(--md-sys-color-on-surface)] font-medium hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer">
        {label}
        {required && <span className="text-[var(--md-sys-color-error)] font-bold">*</span>}
        {tooltip && (
          <div
            title={tooltip}
            className="cursor-help opacity-60 hover:opacity-100 transition-opacity"
          >
            <Info className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          </div>
        )}
      </label>
      <div
        className={`transition-opacity duration-200 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {children}
      </div>
      {helpText && (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1.5 opacity-75">
          {helpText}
        </p>
      )}
    </div>
  );
}
