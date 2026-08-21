import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Package, PlusCircle, ArrowLeft, CheckCircle2, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Button } from '../../components/ui/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

const navItems = [
  { label: 'Dashboard', href: '/customer', icon: <LayoutDashboard size={20} /> },
  { label: 'My Orders', href: '/customer/orders', icon: <Package size={20} /> },
  { label: 'Create Order', href: '/customer/orders/create', icon: <PlusCircle size={20} /> },
];

const ORDER_STATES = [
  'PENDING',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

const getStatusIndex = (status: string) => ORDER_STATES.indexOf(status);

const OrderTrackingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [tracking, setTracking] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await api.get<any[]>(`/orders/${id}/tracking`);
        setTracking(response);
        if (response.length > 0) {
          // Sort by timestamp descending (newest first)
          const sorted = [...response].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setOrderStatus(sorted[0].status);
        }
      } catch (error) {
        console.error('Failed to load tracking', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTracking();
  }, [id]);

  const currentIndex = getStatusIndex(orderStatus);
  const isFailed = orderStatus === 'FAILED';

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/customer/orders/${id}`)} style={{ padding: 0, marginBottom: 'var(--space-2)' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Order Details
          </Button>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Tracking Timeline
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
            {id}
          </p>
        </header>

        {isLoading ? (
          <Skeleton style={{ height: '400px' }} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Events</CardTitle>
            </CardHeader>
            <CardContent>
              {isFailed && (
                <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <AlertCircle size={20} />
                  <span>Delivery Failed. Check history for details.</span>
                </div>
              )}
              
              <div style={{ position: 'relative', paddingLeft: 'var(--space-6)' }}>
                {/* Timeline Line */}
                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--color-border)', zIndex: 0 }}></div>
                
                {tracking.map((event, index) => {
                  const isLatest = index === 0;
                  return (
                    <div key={event.id} style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: index === tracking.length - 1 ? 0 : 'var(--space-8)', position: 'relative', zIndex: 1 }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: isLatest ? 'var(--color-primary)' : 'var(--color-surface)', 
                        border: `2px solid ${isLatest ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: '-23px', // align with line
                        color: isLatest ? 'white' : 'var(--color-text-secondary)'
                      }}>
                        {isLatest ? <CheckCircle2 size={14} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-border)' }} />}
                      </div>
                      
                      <div style={{ marginTop: '-2px' }}>
                        <h4 style={{ fontWeight: isLatest ? 700 : 500, color: isLatest ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                          {event.status.replace(/_/g, ' ')}
                        </h4>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                          <Clock size={12} />
                          {format(new Date(event.timestamp), 'PPpp')}
                        </p>
                        {event.metadata && (
                          <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-3)', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                            {event.metadata}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrderTrackingPage;
