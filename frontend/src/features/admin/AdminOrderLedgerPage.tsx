import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Map, Layers, ClipboardList, Settings, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <Map size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <Layers size={20} /> },
  { label: 'Global Orders', href: '/admin/orders', icon: <ClipboardList size={20} /> },
  { label: 'Zones & Areas', href: '/admin/configuration/zones', icon: <Map size={20} /> },
  { label: 'Rate Cards', href: '/admin/configuration/rates', icon: <Settings size={20} /> },
];

const AdminOrderLedgerPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterZoneId, setFilterZoneId] = useState('');
  
  const [zones, setZones] = useState<any[]>([]);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterStatus) queryParams.append('status', filterStatus);
      if (filterZoneId) queryParams.append('zoneId', filterZoneId);
      const queryString = queryParams.toString();

      const [oRes, zRes] = await Promise.all([
        api.get<any[]>(`/orders${queryString ? `?${queryString}` : ''}`),
        api.get<any[]>('/admin/zones')
      ]);
      setOrders(Array.isArray(oRes) ? oRes : []);
      setZones(Array.isArray(zRes) ? zRes : []);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterZoneId]);

  const handleOverrideStatus = async (orderId: string) => {
    const newStatus = prompt('Enter new status (PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED):');
    if (!newStatus) return;
    try {
      await api.post(`/admin/orders/${orderId}/override-status`, { status: newStatus });
      loadData();
    } catch (err) {
      alert('Failed to override status');
    }
  };

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
              Global Order Ledger
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              System-wide view of all tracking events and historical orders.
            </p>
          </div>
          <Button onClick={() => navigate('/admin/orders/create')}>Create Order</Button>
        </header>

        <Card>
          <CardHeader style={{ paddingBottom: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <Input 
                  placeholder="Search order ID or address..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
              </select>
              
              <select 
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
                value={filterZoneId}
                onChange={e => setFilterZoneId(e.target.value)}
              >
                <option value="">All Zones</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
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
                    <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <Button variant="ghost" onClick={() => handleOverrideStatus(order.id)}>
                          Override
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

export default AdminOrderLedgerPage;
