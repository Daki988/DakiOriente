import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-good text-night hover:bg-[#3ad471] font-semibold',
  secondary: 'border border-line-strong bg-panel-2 text-ink hover:bg-panel-3',
  ghost: 'text-ink-2 hover:bg-panel-2 hover:text-ink',
  danger: 'bg-risk/90 text-white hover:bg-risk font-semibold',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', icon, children, className = '', type = 'button', ...rest }: ButtonProps) {
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${pad} ${styles[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
