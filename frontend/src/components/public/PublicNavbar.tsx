import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import styles from './PublicNavbar.module.css';

export const PublicNavbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(styles.header, isScrolled && styles.scrolled)}>
      <div className={styles.container}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          <Package className={styles.logoIcon} />
          <span className={styles.logoText}>DeliveryTracker</span>
        </div>
        
        <nav className={styles.desktopNav}>
          <a href="#platform" className={styles.navLink}>Platform</a>
          <a href="#intelligence" className={styles.navLink}>Intelligence</a>
          <a href="#tracking" className={styles.navLink}>Tracking</a>
          <a href="#operations" className={styles.navLink}>Operations</a>
        </nav>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => navigate('/login')} className={styles.signInBtn}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/register')} className={styles.getStartedBtn}>
            Get Started
          </Button>
          
          <button 
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNavLinks}>
            <a href="#platform" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Platform</a>
            <a href="#intelligence" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Intelligence</a>
            <a href="#tracking" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Tracking</a>
            <a href="#operations" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Operations</a>
            <div className={styles.mobileNavActions}>
              <Button variant="outline" onClick={() => navigate('/login')} style={{ width: '100%' }}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')} style={{ width: '100%' }}>
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
