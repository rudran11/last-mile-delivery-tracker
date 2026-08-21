import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Map, Layers, ClipboardList, Target, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <Map size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <Layers size={20} /> },
  { label: 'Global Orders', href: '/admin/orders', icon: <ClipboardList size={20} /> },
];

const DispatchPanelPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersData, agentsRes] = await Promise.all([
        api.get<any[]>('/orders'),
        api.get<any[]>('/agents')
      ]);
      
      setOrders(ordersData);
      setAgents(agentsRes);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const availableAgents = agents.filter(a => a.isAvailable);

  const handleAssign = async (orderId: string) => {
    setAssigningId(orderId);
    try {
      await api.post(`/orders/${orderId}/assign`, {});
      alert('Order successfully assigned to the nearest available agent.');
      await fetchData();
    } catch (err: any) {
      console.error('Assignment failed', err);
      alert(err.message || 'Assignment failed. No eligible available agents or conflict occurred.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Dispatch Panel
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            PostGIS Nearest-Agent Routing Engine
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Queue</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton style={{ height: '40px', width: '60px' }} /> : (
                <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-warning)' }}>{pendingOrders.length}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Agents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton style={{ height: '40px', width: '60px' }} /> : (
                <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-primary)' }}>{availableAgents.length}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dispatch Queue</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {isLoading ? (
               <div style={{ padding: 'var(--space-6)' }}>
                 <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
                 <Skeleton style={{ height: '40px' }} />
               </div>
            ) : pendingOrders.length === 0 ? (
              <EmptyState 
                title="No pending orders" 
                description="All active orders have been assigned to agents."
                icon={<Target size={32} />}
                style={{ border: 'none' }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Drop-off</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map(order => (
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
                      <TableCell>{order.pickupZoneId.substring(0, 8)}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleAssign(order.id)}
                          isLoading={assigningId === order.id}
                          disabled={assigningId !== null || availableAgents.length === 0}
                        >
                          <Target size={14} style={{ marginRight: '4px' }} />
                          Assign Nearest
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Availability</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
             {isLoading ? (
               <div style={{ padding: 'var(--space-6)' }}>
                 <Skeleton style={{ height: '40px', marginBottom: '10px' }} />
               </div>
            ) : agents.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>No agents found in system.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location (Lat, Lng)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map(agent => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <User size={16} color="var(--color-text-secondary)" />
                          {agent.name || agent.id.substring(0,8)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.isAvailable ? <Badge variant="success">Available</Badge> : <Badge variant="default">Offline / Busy</Badge>}
                      </TableCell>
                      <TableCell style={{ fontFamily: 'monospace' }}>
                        {agent.location ? `${agent.location.lat.toFixed(4)}, ${agent.location.lng.toFixed(4)}` : 'Unknown'}
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

export default DispatchPanelPage;
