import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import styles from './LandingPage.module.css';
import { Package, Map, Clock, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Package className={styles.logoIcon} />
          <span className={styles.logoText}>DeliveryTracker</span>
        </div>
        <nav className={styles.nav}>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/login')}>
            Get Started
          </Button>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.badge}>Next-Gen Logistics Engine</div>
          <h1 className={styles.title}>
            Intelligent Logistics.<br />
            <span className={styles.highlight}>Geospatial Precision.</span>
          </h1>
          <p className={styles.subtitle}>
            The premium enterprise platform for end-to-end shipment visibility, intelligent nearest-agent assignment, and real-time lifecycle management.
          </p>
          <div className={styles.ctaGroup}>
            <Button size="lg" onClick={() => navigate('/login')}>
              Enter Control Tower
            </Button>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.featureCard}>
            <Map className={styles.featureIcon} />
            <h3>PostGIS Routing</h3>
            <p>Geospatial nearest-agent assignment engine for optimal dispatch.</p>
          </div>
          <div className={styles.featureCard}>
            <Clock className={styles.featureIcon} />
            <h3>Real-Time Lifecycles</h3>
            <p>Strict state-machine driven tracking from pickup to delivery.</p>
          </div>
          <div className={styles.featureCard}>
            <ShieldCheck className={styles.featureIcon} />
            <h3>Role-Based Isolation</h3>
            <p>Secure, segregated experiences for Customers, Agents, and Admins.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
