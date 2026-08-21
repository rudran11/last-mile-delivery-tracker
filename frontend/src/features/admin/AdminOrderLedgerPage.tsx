import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Map, Layers, ClipboardList, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <Map size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <Layers size={20} /> },
  { label: 'Global Orders', href: '/admin/orders', icon: <ClipboardList size={20} /> },
];

const AdminOrderLedgerPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
        <header>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Global Order Ledger
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            System-wide view of all tracking events and historical orders.
          </p>
        </header>

        <Card>
          <CardHeader style={{ paddingBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>All Platform Orders</CardTitle>
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
               <div style={{ padding: 'var(--space-6)' }}>
                 <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                 <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                 <Skeleton style={{ height: '40px' }} />
               </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {order.id.split('-')[0]}...
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {order.orderType} • {order.paymentType}
                      </TableCell>
                      <TableCell>₹{order.calculatedCharge}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
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

export default AdminOrderLedgerPage;
