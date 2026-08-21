import React from 'react';
import { cn } from '../../utils/cn';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          (isLoading || disabled) && styles.disabled,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <span className={styles.spinner} />}
        <span className={cn(isLoading && styles.hiddenContent)}>{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';
