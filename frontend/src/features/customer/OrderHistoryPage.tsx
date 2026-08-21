import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Package, PlusCircle, Search } from 'lucide-react';
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
  { label: 'Dashboard', href: '/customer', icon: <LayoutDashboard size={20} /> },
  { label: 'My Orders', href: '/customer/orders', icon: <Package size={20} /> },
  { label: 'Create Order', href: '/customer/orders/create', icon: <PlusCircle size={20} /> },
];

const OrderHistoryPage = () => {
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
        console.error('Failed to load orders', error);
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
              Order History
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              View and manage all your past and active shipments.
            </p>
          </div>
          <Button onClick={() => navigate('/customer/orders/create')}>
            <PlusCircle size={16} style={{ marginRight: '8px' }} />
            New Order
          </Button>
        </header>

        <Card>
          <CardHeader style={{ paddingBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>All Orders</CardTitle>
              <div style={{ width: '300px' }}>
                <Input 
                  placeholder="Search orders..." 
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
                title="No orders found" 
                description={searchTerm ? "Try a different search term." : "You haven't created any orders yet."}
                icon={<Search size={32} />}
                style={{ border: 'none' }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Drop-off</TableHead>
                    <TableHead>Amount</TableHead>
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
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
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
                      <TableCell>₹{order.calculatedCharge}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/customer/orders/${order.id}`)}>
                          Details
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

export default OrderHistoryPage;
