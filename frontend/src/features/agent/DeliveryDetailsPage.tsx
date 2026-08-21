import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Truck, ArrowLeft, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';

const navItems = [
  { label: 'Dashboard', href: '/agent', icon: <LayoutDashboard size={20} /> },
  { label: 'Active Deliveries', href: '/agent/deliveries', icon: <Truck size={20} /> },
];

const DeliveryDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get<any>(`/orders/${id}`);
      setOrder(response);
    } catch (error) {
      console.error('Failed to load order', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNextStatus = (current: string) => {
    switch (current) {
      case 'ASSIGNED': return 'PICKED_UP';
      case 'PICKED_UP': return 'IN_TRANSIT';
      case 'IN_TRANSIT': return 'OUT_FOR_DELIVERY';
      case 'OUT_FOR_DELIVERY': return 'DELIVERED';
      default: return null;
    }
  };

  const getNextActionLabel = (current: string) => {
    switch (current) {
      case 'ASSIGNED': return 'Acknowledge & Mark Picked Up';
      case 'PICKED_UP': return 'Start Transit';
      case 'IN_TRANSIT': return 'Out for Delivery';
      case 'OUT_FOR_DELIVERY': return 'Mark Delivered';
      default: return null;
    }
  };

  const handleUpdateStatus = async () => {
    if (!order) return;
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return;

    setIsUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, {
        status: nextStatus,
        reason: 'Agent updated status'
      });
      // Refresh
      await fetchOrder();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const nextLabel = order ? getNextActionLabel(order.status) : null;

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <Button variant="ghost" size="sm" onClick={() => navigate('/agent')} style={{ padding: 0, marginBottom: 'var(--space-2)' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Queue
          </Button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                Delivery Execution
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                {id}
              </p>
            </div>
            {order && <Badge>{order.status.replace(/_/g, ' ')}</Badge>}
          </div>
        </header>

        {isLoading ? (
          <Skeleton style={{ height: '300px' }} />
        ) : !order ? (
          <Card>
            <CardContent style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              Order not found.
            </CardContent>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            <Card style={{ gridColumn: '1 / -1' }}>
              <CardHeader>
                <CardTitle>Action Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-bg)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>Current State: {order.status.replace(/_/g, ' ')}</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      Follow strict state progression guidelines.
                    </p>
                  </div>
                  {nextLabel && (
                    <Button 
                      size="lg" 
                      onClick={handleUpdateStatus} 
                      isLoading={isUpdating}
                    >
                      {nextLabel}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Route Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <MapPin color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Pickup Location</p>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{order.pickupAddress}</p>
                    </div>
                  </div>
                  <div style={{ borderLeft: '2px dashed var(--color-border)', marginLeft: '11px', height: '30px' }}></div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <MapPin color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Drop-off Location</p>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{order.dropAddress}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Package Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Service Type</p>
                    <p style={{ fontWeight: 500 }}>{order.orderType} • {order.paymentType}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Weight</p>
                    <p style={{ fontWeight: 500 }}>{order.actualWeight} kg</p>
                  </div>
                  {order.paymentType === 'COD' && (
                    <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Collect: ₹{order.calculatedCharge}</p>
                      <p style={{ fontSize: 'var(--text-xs)' }}>Cash on Delivery required.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDetailsPage;
