import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Truck, Search, Navigation } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';

const navItems = [
  { label: 'Dashboard', href: '/agent', icon: <LayoutDashboard size={20} /> },
  { label: 'Active Deliveries', href: '/agent/deliveries', icon: <Truck size={20} /> },
];

const DeliveryQueuePage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.get<any[]>('/orders');
        setOrders(data);
      } catch (error) {
        console.error('Failed to load assignments', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <Badge variant="success">Delivered</Badge>;
      case 'FAILED': return <Badge variant="error">Failed</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const getAction = (order: any) => {
    switch(order.status) {
      case 'ASSIGNED': return 'Acknowledge & Pickup';
      case 'PICKED_UP': return 'Start Transit';
      case 'IN_TRANSIT': return 'Out for Delivery';
      case 'OUT_FOR_DELIVERY': return 'Mark Delivered';
      default: return 'View Details';
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.dropAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Active Deliveries
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Manage your delivery queue and historical assignments.
            </p>
          </div>
        </header>

        <Card>
          <CardHeader style={{ paddingBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>All Assignments</CardTitle>
              <div style={{ width: '300px' }}>
                <Input 
                  placeholder="Search deliveries..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ paddingTop: 'var(--space-6)' }}>
            {isLoading ? (
              <div>
                <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                <Skeleton style={{ height: '40px' }} />
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState 
                title="No deliveries found" 
                description={searchTerm ? "Try a different search term." : "You have not been assigned any deliveries yet."}
                icon={<Search size={32} />}
                style={{ border: 'none' }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Drop-off</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {order.id.split('-')[0]}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.updatedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.pickupAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.dropAddress}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Button variant={order.status === 'DELIVERED' || order.status === 'FAILED' ? 'ghost' : 'primary'} size="sm" onClick={() => navigate(`/agent/deliveries/${order.id}`)}>
                          {order.status !== 'DELIVERED' && order.status !== 'FAILED' && <Navigation size={14} style={{ marginRight: '4px' }} />}
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

export default DeliveryQueuePage;
