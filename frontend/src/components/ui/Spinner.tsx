import React from 'react';
import { cn } from '../../utils/cn';
import styles from './Spinner.module.css';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white';
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'primary', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(styles.spinner, styles[size], styles[variant], className)}
        {...props}
      />
    );
  }
);
Spinner.displayName = 'Spinner';
