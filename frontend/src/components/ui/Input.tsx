import React from 'react';
import { cn } from '../../utils/cn';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className={cn(styles.wrapper, className)}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(styles.input, error && styles.inputError)}
          {...props}
        />
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
