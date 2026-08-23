import React from 'react';
import { cn } from '../../utils/cn';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  primaryAction,
  secondaryActions,
  breadcrumbs,
  className
}) => {
  return (
    <div className={cn(styles.wrapper, className)}>
      {breadcrumbs && <div className={styles.breadcrumbs}>{breadcrumbs}</div>}
      
      <div className={styles.headerMain}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        
        {(primaryAction || secondaryActions) && (
          <div className={styles.actions}>
            {secondaryActions && <div className={styles.secondaryActions}>{secondaryActions}</div>}
            {primaryAction && <div className={styles.primaryAction}>{primaryAction}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
