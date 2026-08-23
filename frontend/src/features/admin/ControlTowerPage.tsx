import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { api } from '../../services/ApiClient';
import { LiveMap } from '../../components/domain/LiveMap';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './ControlTowerPage.module.css';

const ControlTowerPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    delivered: 0,
    availableAgents: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, agentsRes] = await Promise.all([
          api.get<any[]>('/orders'),
          api.get<any[]>('/agents')
        ]);
        
        let active = 0, pending = 0, delivered = 0, availableAgents = 0;
        
        const ordersList = Array.isArray(ordersData) ? ordersData : [];
        ordersList.forEach(order => {
          if (order.status === 'PENDING') pending++;
          else if (order.status === 'DELIVERED') delivered++;
          else if (order.status !== 'FAILED') active++;
        });

        const agentsList = Array.isArray(agentsRes) ? agentsRes : [];
        agentsList.forEach(agent => {
          if (agent.status === 'AVAILABLE') availableAgents++;
        });
        
        setOrders(ordersList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        setAgents(agentsList);
        setStats({ active, pending, delivered, availableAgents });
      } catch (err) {
        console.error('Failed to load KPIs', err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <Badge variant="success" className={styles.statusBadge}>DELIVERED</Badge>;
      case 'FAILED': return <Badge variant="error" className={styles.statusBadge}>FAILED</Badge>;
      case 'PENDING': return <Badge variant="warning" className={styles.statusBadge}>PENDING</Badge>;
      case 'IN_TRANSIT': return <Badge variant="outline" style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }} className={styles.statusBadge}>IN TRANSIT</Badge>;
      default: return <Badge variant="default" className={styles.statusBadge}>{status}</Badge>;
    }
  };

  const getAgentStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <span style={{ color: '#34D399' }}>Available</span>;
      case 'IN_TRANSIT': return <span style={{ color: '#F59E0B' }}>Transit</span>;
      case 'ACTIVE': return <span style={{ color: '#635BFF' }}>Active</span>;
      default: return <span style={{ color: '#F87171' }}>Offline</span>;
    }
  };

  const hasAttention = stats.pending > 0;

  return (
    <DashboardLayout navItems={[]}>
      <div className={styles.pageWrapper}>
        <PageHeader 
          title="Control Tower"
          description="Real-time visibility across deliveries, fleet and operations."
          secondaryActions={
            <div className={styles.mapTitle}>
              <span className={styles.liveDot}></span> Live operations
            </div>
          }
        />

        {/* KPI Strip */}
        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Pending Assignments</span>
            <span className={styles.kpiValue}>{stats.pending.toString().padStart(2, '0')}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Active / In-Transit</span>
            <span className={styles.kpiValue}>{stats.active.toString().padStart(2, '0')}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Available Agents</span>
            <span className={styles.kpiValue}>{stats.availableAgents.toString().padStart(2, '0')}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Delivered Today</span>
            <span className={styles.kpiValue}>{stats.delivered.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Operational Attention */}
        <div className={`${styles.attentionSection} ${hasAttention ? styles.hasAttention : ''}`}>
          {hasAttention ? <AlertCircle size={20} className={styles.attentionIcon} /> : <CheckCircle2 size={20} className={styles.attentionIcon} />}
          <div>
            <span className={styles.attentionTitle}>
              {hasAttention ? 'OPERATIONAL ATTENTION' : 'ALL OPERATIONS NOMINAL'}
            </span>
            <span className={styles.attentionMessage}>
              {hasAttention 
                ? `${stats.pending} deliveries are awaiting assignment.` 
                : 'No delivery exceptions require attention right now.'}
            </span>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className={styles.workspaceGrid}>
          {/* Map */}
          <div className={styles.mapWorkspace}>
            <div className={styles.mapHeader}>
              <div className={styles.mapTitle}>
                LIVE OPERATIONS
              </div>
              <div className={styles.mapStats}>
                <span><b>{agents.length}</b> Agents</span>
                <span><b>{stats.active}</b> Active</span>
                <span><b>{stats.availableAgents}</b> Available</span>
              </div>
            </div>
            <div className={styles.mapContainer}>
              <LiveMap agents={agents} orders={orders.filter(o => o.status !== 'DELIVERED')} />
            </div>
          </div>

          {/* Fleet Panel */}
          <div className={styles.fleetPanel}>
            <div className={styles.fleetHeader}>ACTIVE FLEET</div>
            <div className={styles.fleetList}>
              {agents.map(agent => (
                <div key={agent.id} className={styles.fleetRow}>
                  <div className={styles.fleetAgent}>
                    <span className={styles.fleetName}>{agent.name}</span>
                    <span className={styles.fleetZone}>{agent.zoneId ? `Zone: ${agent.zoneId.split('-')[0]}` : 'Unassigned'}</span>
                  </div>
                  <div className={styles.fleetStatus}>
                    {getAgentStatusBadge(agent.status)}
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#718096', fontSize: '12px' }}>NO AGENTS FOUND</div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <div className={styles.activitySection}>
          <div className={styles.activityHeader}>RECENT DELIVERY ACTIVITY</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 5).map(order => (
                <TableRow key={order.id}>
                  <TableCell style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {order.id.split('-')[0]}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell>
                    {order.agentId ? agents.find(a => a.id === order.agentId)?.name || order.agentId.split('-')[0] : <span style={{ color: '#718096' }}>Unassigned</span>}
                  </TableCell>
                  <TableCell style={{ color: '#A8B4C7', fontSize: '13px' }}>
                    {new Date(order.updatedAt || order.createdAt).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} style={{ textAlign: 'center', color: '#718096' }}>No active orders.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ControlTowerPage;
