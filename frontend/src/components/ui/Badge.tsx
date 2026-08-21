import React from 'react';
import { cn } from '../../utils/cn';
import styles from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(styles.badge, styles[variant], className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
