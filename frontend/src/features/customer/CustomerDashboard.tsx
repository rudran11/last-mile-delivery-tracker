import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Package, PlusCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const navItems = [
  { label: 'Dashboard', href: '/customer', icon: <LayoutDashboard size={20} /> },
  { label: 'My Orders', href: '/customer/orders', icon: <Package size={20} /> },
  { label: 'Create Order', href: '/customer/orders/create', icon: <PlusCircle size={20} /> },
];

const CustomerDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.get<any[]>('/orders');
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const activeOrders = orders.filter(o => !['DELIVERED', 'FAILED'].includes(o.status));
  const recentOrders = orders.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <Badge variant="success">Delivered</Badge>;
      case 'FAILED': return <Badge variant="error">Failed</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Customer Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Manage your active shipments and view recent activity.
            </p>
          </div>
          <Button onClick={() => navigate('/customer/orders/create')}>
            <PlusCircle size={16} style={{ marginRight: '8px' }} />
            New Order
          </Button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <CardTitle>Active Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton style={{ height: '40px', width: '100px' }} />
              ) : (
                <>
                  <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{activeOrders.length}</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '0.5rem' }}>
                    Currently in transit or processing
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Total Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton style={{ height: '40px', width: '100px' }} />
              ) : (
                <>
                  <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{orders.length}</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '0.5rem' }}>
                    Lifetime orders placed
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: 'var(--space-6)' }}>
                <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                <Skeleton style={{ height: '40px' }} />
              </div>
            ) : recentOrders.length === 0 ? (
              <EmptyState 
                title="No orders yet" 
                description="Create your first shipment to get started." 
                icon={<Package size={32} />}
                action={<Button onClick={() => navigate('/customer/orders/create')}>Create Order</Button>}
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
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {order.id.split('-')[0]}...
                      </TableCell>
                      <TableCell>{order.pickupAddress}</TableCell>
                      <TableCell>{order.dropAddress}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/customer/orders/${order.id}`)}>
                          View Details
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

export default CustomerDashboard;
