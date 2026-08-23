import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Package, Menu, X, User, BarChart, MessageSquare, 
  Map, Box, Users, Settings, PlusCircle, CreditCard, 
  LayoutDashboard, Truck, Package as PackageIcon 
} from 'lucide-react';
import styles from './DashboardLayout.module.css';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const roleNavigation: Record<string, NavGroup[]> = {
  ADMIN: [
    {
      label: 'OPERATIONS',
      items: [
        { label: 'Control Tower', href: '/admin', icon: 'BarChart' },
        { label: 'Communications', href: '/admin/notifications', icon: 'MessageSquare' },
        { label: 'Dispatch Panel', href: '/admin/dispatch', icon: 'Map' },
        { label: 'Order Ledger', href: '/admin/orders', icon: 'Box' },
      ]
    },
    {
      label: 'FLEET',
      items: [
        { label: 'Fleet / Agents', href: '/admin/agents', icon: 'Users' },
        { label: 'Geographic Zones', href: '/admin/configuration/zones', icon: 'Settings' },
      ]
    },
    {
      label: 'COMMERCE',
      items: [
        { label: 'Create Order', href: '/admin/orders/create', icon: 'PlusCircle' },
        { label: 'Rate Cards', href: '/admin/configuration/rates', icon: 'CreditCard' },
      ]
    }
  ],
  AGENT: [
    {
      label: 'MY WORK',
      items: [
        { label: 'Agent Operations', href: '/agent', icon: 'LayoutDashboard' },
        { label: 'Current Queue', href: '/agent/deliveries', icon: 'Truck' },
      ]
    }
  ],
  CUSTOMER: [
    {
      label: 'MY DELIVERIES',
      items: [
        { label: 'Customer Dashboard', href: '/customer', icon: 'LayoutDashboard' },
        { label: 'My Orders', href: '/customer/orders', icon: 'PackageIcon' },
      ]
    },
    {
      label: 'ORDERS',
      items: [
        { label: 'New Order', href: '/customer/orders/create', icon: 'PlusCircle' },
      ]
    }
  ]
};

interface DashboardLayoutProps {
  navItems?: any[]; // Kept for backwards compatibility but ignored
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = (href: string) => {
    navigate(href);
    setIsMobileMenuOpen(false);
  };

  const renderIcon = (iconName: string) => {
    const iconProps = { size: 18 };
    
    switch (iconName) {
      case 'BarChart': return <BarChart {...iconProps} />;
      case 'MessageSquare': return <MessageSquare {...iconProps} />;
      case 'Map': return <Map {...iconProps} />;
      case 'Box': return <Box {...iconProps} />;
      case 'Users': return <Users {...iconProps} />;
      case 'Settings': return <Settings {...iconProps} />;
      case 'PlusCircle': return <PlusCircle {...iconProps} />;
      case 'CreditCard': return <CreditCard {...iconProps} />;
      case 'LayoutDashboard': return <LayoutDashboard {...iconProps} />;
      case 'Truck': return <Truck {...iconProps} />;
      case 'PackageIcon': return <PackageIcon {...iconProps} />;
      default: return null;
    }
  };

  // Determine active navigation based on user role
  const currentRole = user?.role || 'CUSTOMER';
  const activeNavGroups = roleNavigation[currentRole] || roleNavigation['CUSTOMER'];

  // Identify active item robustly
  const isActiveItem = (href: string) => {
    if (href === '/admin' || href === '/agent' || href === '/customer') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(`${href}/`) || location.pathname === href;
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
          {activeNavGroups.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{group.label}</div>
              {group.items.map((item) => {
                const isActive = isActiveItem(item.href);
                return (
                  <button
                    key={item.href}
                    className={cn(styles.navItem, isActive && styles.navItemActive)}
                    onClick={() => handleNavClick(item.href)}
                  >
                    {renderIcon(item.icon)}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <User size={16} />
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'User'}</span>
              <span className={styles.userEmail}>{user?.email || ''}</span>
              <span className={styles.userRole}>{user?.role || ''}</span>
            </div>
          </div>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <span className={styles.logoutIcon}>↪</span> Sign out
          </button>
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
