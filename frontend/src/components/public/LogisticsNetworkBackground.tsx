import React from 'react';
import styles from './LogisticsNetworkBackground.module.css';

export const LogisticsNetworkBackground = () => {
  return (
    <div className={styles.container} aria-hidden="true">
      <div className={styles.grid}></div>
      <div className={styles.nodes}>
        {/* We'll use CSS to draw some abstract connections to keep it performant */}
        <div className={styles.node} style={{ top: '30%', left: '20%' }}></div>
        <div className={styles.node} style={{ top: '60%', left: '40%' }}></div>
        <div className={styles.node} style={{ top: '25%', left: '60%' }}></div>
        <div className={styles.node} style={{ top: '70%', left: '75%' }}></div>
        
        <svg className={styles.connections} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <path d="M 20% 30% L 40% 60% L 75% 70%" className={styles.path} />
          <path d="M 20% 30% L 60% 25% L 75% 70%" className={styles.path} />
          
          <circle cx="20%" cy="30%" r="4" className={styles.pulseNode} />
          <circle cx="75%" cy="70%" r="4" className={styles.pulseNode} style={{ animationDelay: '1s' }} />
        </svg>
      </div>
      <div className={styles.fadeOverlay}></div>
    </div>
  );
};
