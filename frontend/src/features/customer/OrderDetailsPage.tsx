import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Package, PlusCircle, ArrowLeft, MapPin, Map } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';

const navItems = [
  { label: 'Dashboard', href: '/customer', icon: <LayoutDashboard size={20} /> },
  { label: 'My Orders', href: '/customer/orders', icon: <Package size={20} /> },
  { label: 'Create Order', href: '/customer/orders/create', icon: <PlusCircle size={20} /> },
];

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
    fetchOrder();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <Badge variant="success">Delivered</Badge>;
      case 'FAILED': return <Badge variant="error">Failed</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const handleReschedule = async () => {
    if (!order) return;
    if (!rescheduleDate) {
      alert('Please select a future scheduled date');
      return;
    }
    
    const selectedDate = new Date(rescheduleDate);
    if (selectedDate <= new Date()) {
      alert('Please select a valid future date');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to reschedule this order to ${format(selectedDate, 'PPpp')}?`);
    if (!confirmed) return;

    setIsRescheduling(true);
    try {
      await api.post(`/orders/${order.id}/reschedule`, { scheduledDate: selectedDate.toISOString() });
      alert('Order rescheduled successfully!');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule order');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <Button variant="ghost" size="sm" onClick={() => navigate('/customer/orders')} style={{ padding: 0, marginBottom: 'var(--space-2)' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Orders
          </Button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                Order Details
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                {id}
              </p>
            </div>
            {order && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {order.status === 'FAILED' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="datetime-local" 
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
                    />
                    <Button onClick={handleReschedule} disabled={isRescheduling}>
                      {isRescheduling ? 'Submitting...' : 'Reschedule Order'}
                    </Button>
                  </div>
                )}
                <Button onClick={() => navigate(`/customer/orders/${id}/tracking`)}>
                  <Map size={16} style={{ marginRight: '8px' }} />
                  Live Tracking
                </Button>
              </div>
            )}
          </div>
        </header>

        {isLoading ? (
          <div>
            <Skeleton style={{ height: '200px', marginBottom: '20px' }} />
            <Skeleton style={{ height: '300px' }} />
          </div>
        ) : !order ? (
          <Card>
            <CardContent style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              Order not found.
            </CardContent>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CardTitle>Shipment Status</CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Created On</p>
                    <p style={{ fontWeight: 500 }}>{format(new Date(order.createdAt), 'PPpp')}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Service Type</p>
                    <p style={{ fontWeight: 500 }}>{order.orderType} • {order.paymentType}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Dimensions (L×W×H)</p>
                    <p style={{ fontWeight: 500 }}>{order.length} × {order.breadth} × {order.height} cm</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Weight</p>
                    <p style={{ fontWeight: 500 }}>{order.actualWeight} kg (Billable: {order.billableWeight} kg)</p>
                  </div>
                  {order.agentId && (
                    <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Assigned Agent ID</p>
                      <p style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{order.agentId}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <MapPin color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Pickup</p>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{order.pickupAddress}</p>
                    </div>
                  </div>
                  <div style={{ borderLeft: '2px dashed var(--color-border)', marginLeft: '11px', height: '20px' }}></div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <MapPin color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Drop-off</p>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{order.dropAddress}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ gridColumn: '1 / -1' }}>
              <CardHeader>
                <CardTitle>Pricing Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {order.pricingSnapshot ? (
                  <div style={{ maxWidth: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Base Charge</span>
                      <span>₹{order.pricingSnapshot.baseCharge}</span>
                    </div>
                    {order.pricingSnapshot.appliedCodSurcharge > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>COD Surcharge</span>
                        <span>₹{order.pricingSnapshot.appliedCodSurcharge}</span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--color-primary)' }}>₹{order.calculatedCharge}</span>
                    </div>
                  </div>
                ) : (
                  <p>Pricing details unavailable.</p>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrderDetailsPage;
