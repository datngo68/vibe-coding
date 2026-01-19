import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Button = ({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) => {
  const baseClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2 min-h-[44px]',
    lg: 'text-base px-6 py-3 min-h-[48px]',
  };
  return (
    <button 
      className={`${baseClasses} touch-manipulation ${sizeClasses[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
