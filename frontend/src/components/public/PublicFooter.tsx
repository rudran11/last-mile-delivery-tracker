import React from 'react';
import { Package } from 'lucide-react';
import styles from './PublicFooter.module.css';

export const PublicFooter = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandSection}>
          <div className={styles.logo}>
            <Package className={styles.logoIcon} />
            <span className={styles.logoText}>DeliveryTracker</span>
          </div>
          <p className={styles.description}>
            Intelligent dispatch and real-time logistics visibility platform.
          </p>
        </div>
        
        <div className={styles.linksSection}>
          <div className={styles.linkColumn}>
            <h4 className={styles.linkHeader}>Platform</h4>
            <a href="#platform" className={styles.link}>Operations</a>
            <a href="#intelligence" className={styles.link}>Intelligence</a>
            <a href="#tracking" className={styles.link}>Tracking</a>
          </div>
          
          <div className={styles.linkColumn}>
            <h4 className={styles.linkHeader}>Technology</h4>
            <span className={styles.textOnly}>Geospatial Routing</span>
            <span className={styles.textOnly}>Automated Dispatch</span>
            <span className={styles.textOnly}>Operational Analytics</span>
          </div>
          
          <div className={styles.linkColumn}>
            <h4 className={styles.linkHeader}>Account</h4>
            <a href="/login" className={styles.link}>Sign In</a>
            <a href="/register" className={styles.link}>Get Started</a>
          </div>
        </div>
      </div>
      
      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} DeliveryTracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
