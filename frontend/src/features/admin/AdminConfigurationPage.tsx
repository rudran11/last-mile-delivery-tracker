import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Settings, Map, MapPin, Plus, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/ApiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <Settings size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <MapPin size={20} /> },
  { label: 'Global Orders', href: '/admin/orders', icon: <Map size={20} /> },
  { label: 'Zones & Areas', href: '/admin/configuration/zones', icon: <Map size={20} /> },
  { label: 'Rate Cards', href: '/admin/configuration/rates', icon: <Settings size={20} /> },
];

const AdminConfigurationPage = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [newZoneName, setNewZoneName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPincode, setNewAreaPincode] = useState('');
  const [newAreaZoneId, setNewAreaZoneId] = useState('');

  const loadData = async () => {
    try {
      const [zData, aData] = await Promise.all([
        api.get<any[]>('/admin/zones'),
        api.get<any[]>('/admin/areas')
      ]);
      const finalZones = Array.isArray(zData) ? zData : [];
      const finalAreas = Array.isArray(aData) ? aData : [];
      setZones(finalZones);
      setAreas(finalAreas);
      if (finalZones.length > 0 && !newAreaZoneId) {
        setNewAreaZoneId(finalZones[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/zones', { name: newZoneName, isActive: true });
      setNewZoneName('');
      loadData();
    } catch (err) {
      alert('Failed to create zone');
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/areas', { 
        name: newAreaName, 
        pincode: newAreaPincode, 
        zoneId: newAreaZoneId, 
        isActive: true 
      });
      setNewAreaName('');
      setNewAreaPincode('');
      loadData();
    } catch (err) {
      alert('Failed to create area');
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Zones & Areas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Configure operational zones and assign service areas (pincodes).
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {/* ZONES */}
          <Card>
            <CardHeader>
              <CardTitle>Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateZone} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <Input 
                  placeholder="New Zone Name" 
                  value={newZoneName} 
                  onChange={e => setNewZoneName(e.target.value)} 
                  required 
                />
                <Button type="submit"><Plus size={16} /> Add Zone</Button>
              </form>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map(z => (
                    <TableRow key={z.id}>
                      <TableCell>{z.name}</TableCell>
                      <TableCell>
                        <Badge variant={z.isActive ? "success" : "default"}>
                          {z.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* AREAS */}
          <Card>
            <CardHeader>
              <CardTitle>Areas (Pincodes)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateArea} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <Input 
                  placeholder="Area Name" 
                  value={newAreaName} 
                  onChange={e => setNewAreaName(e.target.value)} 
                  required 
                />
                <Input 
                  placeholder="Pincode" 
                  value={newAreaPincode} 
                  onChange={e => setNewAreaPincode(e.target.value)} 
                  required 
                />
                <select 
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  value={newAreaZoneId}
                  onChange={e => setNewAreaZoneId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Zone</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
                <Button type="submit"><Plus size={16} /> Add Area</Button>
              </form>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area Name</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Zone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.pincode}</TableCell>
                      <TableCell>{a.zone?.name}</TableCell>
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

export default AdminConfigurationPage;
