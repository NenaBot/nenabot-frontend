import React from 'react';

interface MaterialSymbolProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: 'small' | 'default' | 'large';
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  fill?: boolean;
  grade?: -25 | 0 | 200;
}

export const MaterialSymbol = React.forwardRef<
  HTMLSpanElement,
  MaterialSymbolProps
>(
  (
    {
      name,
      size = 'default',
      weight = 400,
      fill = false,
      grade = 0,
      className = '',
      style = {},
      ...props
    },
    ref
  ) => {
    const sizeClass =
      size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base';

    const symbolStyle: React.CSSProperties = {
      fontVariationSettings: `'opsz' 24, 'wght' ${weight}, 'FILL' ${
        fill ? 1 : 0
      }, 'GRAD' ${grade}`,
      ...style,
    };

    return (
      <span
        ref={ref}
        className={`material-symbols-outlined leading-none inline-flex ${sizeClass} ${className}`}
        style={symbolStyle}
        {...props}
      >
        {name}
      </span>
    );
  }
);

MaterialSymbol.displayName = 'MaterialSymbol';
