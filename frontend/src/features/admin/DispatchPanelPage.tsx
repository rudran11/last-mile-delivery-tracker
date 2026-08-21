import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Map, Layers, ClipboardList, Target, User, X, BarChart, MessageSquare, Box, PlusCircle, Settings, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <BarChart size={20} /> },
  { label: 'Communications', href: '/admin/notifications', icon: <MessageSquare size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <Map size={20} /> },
  { label: 'Order Ledger', href: '/admin/orders', icon: <Box size={20} /> },
  { label: 'Create Order', href: '/admin/orders/create', icon: <PlusCircle size={20} /> },
  { label: 'Geographic Zones', href: '/admin/configuration/zones', icon: <Settings size={20} /> },
  { label: 'Rate Cards', href: '/admin/configuration/rates', icon: <CreditCard size={20} /> },
];

const DispatchPanelPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  
  const [reassignModal, setReassignModal] = useState<{ isOpen: boolean; orderId: string | null; selectedAgentId: string | null }>({
    isOpen: false,
    orderId: null,
    selectedAgentId: null,
  });

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

  const handleAssignNearest = async (orderId: string) => {
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

  const handleManualReassign = async () => {
    if (!reassignModal.orderId || !reassignModal.selectedAgentId) return;
    
    setAssigningId(reassignModal.orderId);
    try {
      await api.post(`/orders/${reassignModal.orderId}/reassign`, { agentId: reassignModal.selectedAgentId });
      alert('Order successfully reassigned.');
      setReassignModal({ isOpen: false, orderId: null, selectedAgentId: null });
      await fetchData();
    } catch (err: any) {
      console.error('Reassignment failed', err);
      alert(err.message || 'Reassignment failed.');
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
            PostGIS Nearest-Agent Routing Engine & Manual Dispatch
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
            ) : orders.filter(o => ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length === 0 ? (
              <EmptyState 
                title="No active orders" 
                description="There are no active orders requiring dispatch."
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
                    <TableHead>Assignment State</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders
                    .filter(o => ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status))
                    .map(order => (
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
                      <TableCell>
                        {order.status === 'PENDING' ? (
                          <Badge variant="warning">PENDING ASSIGNMENT</Badge>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Badge variant="success">ASSIGNED</Badge>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              Agent ID: {order.agentId?.substring(0, 8)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {order.status === 'PENDING' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleAssignNearest(order.id)}
                              isLoading={assigningId === order.id}
                              disabled={assigningId !== null || availableAgents.length === 0}
                            >
                              <Target size={14} style={{ marginRight: '4px' }} />
                              Nearest
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setReassignModal({ isOpen: true, orderId: order.id, selectedAgentId: null })}
                            disabled={assigningId !== null || availableAgents.length === 0}
                          >
                            <User size={14} style={{ marginRight: '4px' }} />
                            {order.status === 'PENDING' ? 'Manual Assign' : 'Reassign'}
                          </Button>
                        </div>
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

      {reassignModal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            backgroundColor: 'var(--color-surface)', width: '400px', borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden', border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Manual Assignment</h3>
              <button onClick={() => setReassignModal({ isOpen: false, orderId: null, selectedAgentId: null })} style={{ color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Select an available agent for Order <strong style={{color: 'var(--color-text-primary)'}}>{reassignModal.orderId?.split('-')[0]}</strong>.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                {availableAgents.map(agent => (
                  <div 
                    key={agent.id}
                    onClick={() => setReassignModal(prev => ({ ...prev, selectedAgentId: agent.id }))}
                    style={{
                      padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid',
                      borderColor: reassignModal.selectedAgentId === agent.id ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: reassignModal.selectedAgentId === agent.id ? 'var(--color-primary-light)' : 'transparent',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{agent.name || `Agent ${agent.id.substring(0,8)}`}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {agent.location ? `Lat: ${agent.location.lat.toFixed(4)}, Lng: ${agent.location.lng.toFixed(4)}` : 'Location unknown'}
                      </div>
                    </div>
                    {reassignModal.selectedAgentId === agent.id && (
                      <div style={{ color: 'var(--color-primary)' }}><Target size={18} /></div>
                    )}
                  </div>
                ))}
                {availableAgents.length === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-error)', backgroundColor: 'var(--color-error-bg)', borderRadius: '0.375rem' }}>
                    No agents are currently available.
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="ghost" onClick={() => setReassignModal({ isOpen: false, orderId: null, selectedAgentId: null })}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualReassign} 
                  disabled={!reassignModal.selectedAgentId || assigningId !== null}
                  isLoading={assigningId !== null}
                >
                  Confirm Assignment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DispatchPanelPage;
