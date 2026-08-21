import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Package, LogOut, Menu, X, User } from 'lucide-react';
import styles from './DashboardLayout.module.css';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ navItems, children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (href: string) => {
    navigate(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.brand}>
          <Package className={styles.brandIcon} />
          <span>DeliveryTracker</span>
        </div>
        <button 
          className={styles.menuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(styles.sidebar, isMobileMenuOpen && styles.sidebarOpen)}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <Package className={styles.brandIcon} />
            <span>DeliveryTracker</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const activeNavItem = [...navItems].sort((a, b) => b.href.length - a.href.length).find(nav => 
              location.pathname === nav.href || location.pathname.startsWith(`${nav.href}/`)
            );
            const isActive = activeNavItem?.href === item.href;

            return (
              <button
                key={item.href}
                className={cn(styles.navItem, isActive && styles.navItemActive)}
                onClick={() => handleNavClick(item.href)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <User size={16} />
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userEmail} style={{ fontWeight: 600 }}>{user?.name || user?.email}</span>
              {user?.name && <span className={styles.userRole} style={{ fontSize: '0.7rem' }}>{user?.email}</span>}
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          </div>
          <Button variant="ghost" className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          {children || <Outlet />}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
};
