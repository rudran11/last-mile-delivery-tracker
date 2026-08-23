import React from 'react';
import styles from './ProductPreview.module.css';

export const ProductPreview = () => {
  return (
    <div className={styles.container} aria-hidden="true">
      <div className={styles.window}>
        <div className={styles.header}>
          <div className={styles.controls}>
            <div className={styles.control} style={{ backgroundColor: '#ff5f56' }} />
            <div className={styles.control} style={{ backgroundColor: '#ffbd2e' }} />
            <div className={styles.control} style={{ backgroundColor: '#27c93f' }} />
          </div>
          <div className={styles.titleBar}>delivery-tracker.unthinkable.co</div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.sidebar}>
            <div className={styles.sidebarItem} style={{ width: '60%' }} />
            <div className={styles.sidebarItem} style={{ width: '80%' }} />
            <div className={styles.sidebarItem} style={{ width: '70%', marginTop: 'auto' }} />
          </div>
          
          <div className={styles.main}>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <div className={styles.statLabel} style={{ width: '40%' }} />
                <div className={styles.statValue} style={{ width: '25%' }} />
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel} style={{ width: '45%' }} />
                <div className={styles.statValue} style={{ width: '30%' }} />
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel} style={{ width: '35%' }} />
                <div className={styles.statValue} style={{ width: '20%' }} />
              </div>
            </div>
            
            <div className={styles.mapArea}>
              <div className={styles.mapGrid} />
              <div className={styles.routePath} />
              <div className={styles.agentMarker} style={{ top: '40%', left: '30%' }} />
              <div className={styles.agentMarker} style={{ top: '65%', left: '70%' }} />
              <div className={styles.destinationMarker} style={{ top: '25%', left: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
