import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id || React.useId();
    
    return (
      <div className={cn(styles.wrapper, className)}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.selectWrapper}>
          <select
            id={selectId}
            ref={ref}
            className={cn(styles.select, error && styles.selectError)}
            {...props}
          >
            {children}
          </select>
          <div className={styles.iconWrapper}>
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
