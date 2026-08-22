import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Settings, Map, MapPin, Plus, BarChart, MessageSquare, Box, PlusCircle, CreditCard , Users} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <BarChart size={20} /> },
  { label: 'Fleet / Agents', href: '/admin/agents', icon: <Users size={20} /> },
  { label: 'Communications', href: '/admin/notifications', icon: <MessageSquare size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <Map size={20} /> },
  { label: 'Order Ledger', href: '/admin/orders', icon: <Box size={20} /> },
  { label: 'Create Order', href: '/admin/orders/create', icon: <PlusCircle size={20} /> },
  { label: 'Geographic Zones', href: '/admin/configuration/zones', icon: <Settings size={20} /> },
  { label: 'Rate Cards', href: '/admin/configuration/rates', icon: <CreditCard size={20} /> },
];

const AdminRateCardsPage = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const [b2bIntraZoneRate, setB2bIntraZoneRate] = useState('');
  const [b2bInterZoneRate, setB2bInterZoneRate] = useState('');
  const [b2cIntraZoneRate, setB2cIntraZoneRate] = useState('');
  const [b2cInterZoneRate, setB2cInterZoneRate] = useState('');
  const [b2bCodSurcharge, setB2bCodSurcharge] = useState('');
  const [b2cCodSurcharge, setB2cCodSurcharge] = useState('');

  const loadData = async () => {
    try {
      const res = await api.get<any[]>('/admin/rates');
      setRates(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/rates', {
        b2bIntraZoneRate: Number(b2bIntraZoneRate),
        b2bInterZoneRate: Number(b2bInterZoneRate),
        b2cIntraZoneRate: Number(b2cIntraZoneRate),
        b2cInterZoneRate: Number(b2cInterZoneRate),
        b2bCodSurcharge: Number(b2bCodSurcharge),
        b2cCodSurcharge: Number(b2cCodSurcharge),
        isActive: true
      });
      // Reset
      setB2bIntraZoneRate('');
      setB2bInterZoneRate('');
      setB2cIntraZoneRate('');
      setB2cInterZoneRate('');
      setB2bCodSurcharge('');
      setB2cCodSurcharge('');
      loadData();
    } catch (err) {
      alert('Failed to create rate configuration');
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Rate Cards
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Configure pricing formulas and COD surcharges.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <Card>
            <CardHeader>
              <CardTitle>Create New Rate Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>B2B Intra-Zone Rate (₹/kg)</label>
                  <Input type="number" step="0.01" value={b2bIntraZoneRate} onChange={e => setB2bIntraZoneRate(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>B2B Inter-Zone Rate (₹/kg)</label>
                  <Input type="number" step="0.01" value={b2bInterZoneRate} onChange={e => setB2bInterZoneRate(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>B2C Intra-Zone Rate (₹/kg)</label>
                  <Input type="number" step="0.01" value={b2cIntraZoneRate} onChange={e => setB2cIntraZoneRate(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>B2C Inter-Zone Rate (₹/kg)</label>
                  <Input type="number" step="0.01" value={b2cInterZoneRate} onChange={e => setB2cInterZoneRate(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>B2B COD Surcharge (₹)</label>
                  <Input type="number" step="0.01" value={b2bCodSurcharge} onChange={e => setB2bCodSurcharge(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>B2C COD Surcharge (₹)</label>
                  <Input type="number" step="0.01" value={b2cCodSurcharge} onChange={e => setB2cCodSurcharge(e.target.value)} required />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <Button type="submit"><Plus size={16} style={{ marginRight: '8px' }} /> Activate New Rate Card</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historical Rate Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created At</TableHead>
                    <TableHead>B2B (Intra / Inter)</TableHead>
                    <TableHead>B2C (Intra / Inter)</TableHead>
                    <TableHead>COD Surcharge (B2B / B2C)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                      <TableCell>₹{r.b2bIntraZoneRate} / ₹{r.b2bInterZoneRate}</TableCell>
                      <TableCell>₹{r.b2cIntraZoneRate} / ₹{r.b2cInterZoneRate}</TableCell>
                      <TableCell>₹{r.b2bCodSurcharge} / ₹{r.b2cCodSurcharge}</TableCell>
                      <TableCell>
                        <Badge variant={r.isActive ? 'success' : 'default'}>
                          {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminRateCardsPage;
