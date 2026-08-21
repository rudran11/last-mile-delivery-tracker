import React from 'react';
import { cn } from '../../utils/cn';
import styles from './Skeleton.module.css';

export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(styles.skeleton, className)}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';
