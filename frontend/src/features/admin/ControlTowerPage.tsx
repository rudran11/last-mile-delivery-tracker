import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Map, Layers, ClipboardList } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { LiveMap } from '../../components/domain/LiveMap';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <Map size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <Layers size={20} /> },
  { label: 'Global Orders', href: '/admin/orders', icon: <ClipboardList size={20} /> },
];

const ControlTowerPage = () => {
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    delivered: 0
  });
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, agentsRes] = await Promise.all([
          api.get<any[]>('/orders'),
          api.get<any[]>('/agents')
        ]);
        
        let active = 0, pending = 0, delivered = 0;
        ordersData.forEach(order => {
          if (order.status === 'PENDING') pending++;
          else if (order.status === 'DELIVERED') delivered++;
          else active++;
        });
        
        setStats({ active, pending, delivered });
        setAgents(agentsRes);
      } catch (err) {
        console.error('Failed to load KPIs', err);
      }
    };
    
    fetchData();
  }, []);

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Control Tower
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Logistics engine overview and geospatial intelligence.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <CardTitle>Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{stats.pending}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active / In-Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{stats.active}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivered Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{stats.delivered}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live Operations Map</CardTitle>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Geospatial view of active agents.
            </p>
          </CardHeader>
          <CardContent>
            <LiveMap agents={agents} orders={[]} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ControlTowerPage;
