import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Truck, CheckCircle2, Navigation } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

const navItems = [
  { label: 'Dashboard', href: '/agent', icon: <LayoutDashboard size={20} /> },
  { label: 'Active Deliveries', href: '/agent/deliveries', icon: <Truck size={20} /> },
];

const AgentDashboard = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // The Sprint 2 API does not have a dedicated GET /deliveries for agents
    // However, the agent can GET /orders and it relies on RBAC returning orders assigned to them.
    // Wait, the OrderQueryController lists ALL orders the user has access to.
    const fetchAssignments = async () => {
      try {
        const data = await api.get<any[]>('/orders');
        setOrders(data);
      } catch (err) {
        console.error('Failed to load assignments', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  // For this agent, we care about ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY
  const activeAssignments = orders.filter(o => 
    ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)
  );

  const completedToday = orders.filter(o => o.status === 'DELIVERED').length;

  const getAction = (order: any) => {
    switch(order.status) {
      case 'ASSIGNED': return 'Acknowledge & Pickup';
      case 'PICKED_UP': return 'Start Transit';
      case 'IN_TRANSIT': return 'Out for Delivery';
      case 'OUT_FOR_DELIVERY': return 'Mark Delivered';
      default: return 'View';
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Agent Operations
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Manage your availability and view today's tasks.
            </p>
          </div>
          {/* Note: The API doesn't have an endpoint to toggle Agent availability yet. 
              This is UI-only for the scope of Sprint 3 unless we add a backend patch. */}
          <Button 
            variant={isAvailable ? 'primary' : 'outline'}
            onClick={() => setIsAvailable(!isAvailable)}
          >
            {isAvailable ? 'Status: Available' : 'Status: Offline'}
          </Button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <CardTitle>Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton style={{ height: '40px', width: '60px' }} /> : (
                <>
                  <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{activeAssignments.length}</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '0.5rem' }}>
                    Orders waiting for your action
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton style={{ height: '40px', width: '60px' }} /> : (
                <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-success)' }}>{completedToday}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Queue</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {isLoading ? (
               <div style={{ padding: 'var(--space-6)' }}>
                 <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                 <Skeleton style={{ height: '40px' }} />
               </div>
            ) : activeAssignments.length === 0 ? (
              <EmptyState 
                title="Queue is empty" 
                description="You have no active assignments right now. Stay online to receive dispatch orders."
                icon={<CheckCircle2 size={32} />}
                style={{ border: 'none' }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Drop-off</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAssignments.map(order => (
                    <TableRow key={order.id}>
                      <TableCell style={{ fontFamily: 'monospace', fontSize: '12px' }}>{order.id.split('-')[0]}</TableCell>
                      <TableCell>
                        <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.pickupAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.dropAddress}
                        </div>
                      </TableCell>
                      <TableCell><Badge>{order.status}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => navigate(`/agent/deliveries/${order.id}`)}>
                          <Navigation size={14} style={{ marginRight: '4px' }} />
                          {getAction(order)}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;
