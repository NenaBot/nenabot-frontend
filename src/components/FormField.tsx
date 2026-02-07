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
    <div>
      <label className="flex items-center gap-1 text-sm mb-2 text-(--md-sys-color-on-surface)">
        {label}
        {required && <span className="text-red-600">*</span>}
        {tooltip && (
          <div title={tooltip} className="cursor-help">
            <Info className="w-3.5 h-3.5 text-(--md-sys-color-on-surface-variant)" />
          </div>
        )}
      </label>
      <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
      {helpText && (
        <p className="text-xs text-(--md-sys-color-on-surface-variant) mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
}
