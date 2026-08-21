import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Customer
import CustomerDashboard from './features/customer/CustomerDashboard';
import CreateOrderPage from './features/customer/CreateOrderPage';
import OrderHistoryPage from './features/customer/OrderHistoryPage';
import OrderDetailsPage from './features/customer/OrderDetailsPage';
import OrderTrackingPage from './features/customer/OrderTrackingPage';

// Agent
import AgentDashboard from './features/agent/AgentDashboard';
import DeliveryQueuePage from './features/agent/DeliveryQueuePage';
import DeliveryDetailsPage from './features/agent/DeliveryDetailsPage';

// Admin
import ControlTowerPage from './features/admin/ControlTowerPage';
import DispatchPanelPage from './features/admin/DispatchPanelPage';
import AdminOrderLedgerPage from './features/admin/AdminOrderLedgerPage';
import AdminConfigurationPage from './features/admin/AdminConfigurationPage';
import AdminRateCardsPage from './features/admin/AdminRateCardsPage';
import AdminCreateOrderPage from './features/admin/AdminCreateOrderPage';

const App = () => {
  const { initialize, isInitializing } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isInitializing) {
    return null; // or a nice splash screen
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Routes */}
        <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/orders" element={<OrderHistoryPage />} />
          <Route path="/customer/orders/create" element={<CreateOrderPage />} />
          <Route path="/customer/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/customer/orders/:id/tracking" element={<OrderTrackingPage />} />
        </Route>

        {/* Agent Routes */}
        <Route element={<ProtectedRoute allowedRoles={['AGENT']} />}>
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/agent/deliveries" element={<DeliveryQueuePage />} />
          <Route path="/agent/deliveries/:id" element={<DeliveryDetailsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<ControlTowerPage />} />
          <Route path="/admin/dispatch" element={<DispatchPanelPage />} />
          <Route path="/admin/orders" element={<AdminOrderLedgerPage />} />
          <Route path="/admin/orders/create" element={<AdminCreateOrderPage />} />
          <Route path="/admin/configuration/zones" element={<AdminConfigurationPage />} />
          <Route path="/admin/configuration/rates" element={<AdminRateCardsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
