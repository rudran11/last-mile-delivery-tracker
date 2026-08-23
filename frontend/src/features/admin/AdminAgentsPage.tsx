import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/ApiClient';
import { Map, Users, Settings, BarChart, MessageSquare, Box, PlusCircle, CreditCard, UserPlus, Edit2, AlertTriangle, MapPin, PowerOff, Power, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminAgentsPage.module.css';

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

export const AdminAgentsPage = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', lat: 0, lng: 0, isAvailable: true, zoneId: ''
  });

  const loadData = async () => {
    try {
      const [agentsData, zonesData]: any = await Promise.all([
        api.get('/admin/agents'),
        api.get('/admin/zones')
      ]);
      
      if (Array.isArray(agentsData)) {
        setAgents(agentsData);
      } else if (agentsData && Array.isArray(agentsData.data)) {
        setAgents(agentsData.data);
      } else {
        setAgents([]);
      }

      if (Array.isArray(zonesData)) {
        setZones(zonesData);
      } else if (zonesData && Array.isArray(zonesData.data)) {
        setZones(zonesData.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await api.put(`/admin/agents/${editingAgent.id}`, {
          name: formData.name,
          lat: Number(formData.lat),
          lng: Number(formData.lng),
          isAvailable: formData.isAvailable,
          zoneId: formData.zoneId || null
        });
      } else {
        await api.post('/admin/agents', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          lat: Number(formData.lat),
          lng: Number(formData.lng),
          isAvailable: formData.isAvailable
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Error saving agent: ' + (err as Error).message);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this agent? They will no longer receive assignments.')) {
      try {
        await api.delete(`/admin/agents/${id}`);
        loadData();
      } catch (err) {
        alert('Error deactivating agent');
      }
    }
  };

  const activeAgentsCount = agents.length;
  const availableCount = agents.filter(a => a.isAvailable).length;
  const busyCount = agents.filter(a => !a.isAvailable).length;

  return (
    <DashboardLayout navItems={navItems}>
      <div className={styles.statsGrid}>
        <Card>
          <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--surface-active)', borderRadius: '50%' }}>
              <Users size={24} color="var(--primary)" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Active Agents</p>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{activeAgentsCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--success-surface)', borderRadius: '50%' }}>
              <Power size={24} color="var(--success)" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Available for Dispatch</p>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{availableCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--warning-surface)', borderRadius: '50%' }}>
              <AlertTriangle size={24} color="var(--warning)" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Busy / Offline</p>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{busyCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
        <h2>Delivery Fleet</h2>
        <Button 
          variant="primary" 
          onClick={() => {
            setEditingAgent(null);
            setFormData({ name: '', email: '', password: '', lat: 0, lng: 0, isAvailable: true, zoneId: '' });
            setIsModalOpen(true);
          }}
        >
          <UserPlus size={16} /> Add Agent
        </Button>
      </div>

      <Card>
        <CardContent style={{ padding: 0, overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Email</th>
                <th>Current Zone</th>
                <th>Current Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td><strong>{agent.name || 'Unknown'}</strong></td>
                  <td>{agent.email}</td>
                  <td>
                    <Badge variant="outline">{agent.zoneName || 'Unassigned'}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={14} />
                      {agent.lat?.toFixed(4)}, {agent.lng?.toFixed(4)}
                    </div>
                  </td>
                  <td>
                    <Badge variant={agent.isAvailable ? 'success' : 'warning'}>
                      {agent.isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          setEditingAgent(agent);
                          setFormData({
                            name: agent.name || '',
                            email: agent.email,
                            password: '',
                            lat: agent.lat || 0,
                            lng: agent.lng || 0,
                            isAvailable: agent.isAvailable,
                            zoneId: agent.zoneId || ''
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/admin/agents/${agent.id}/performance`)}>
                        <Activity size={14} /> Performance
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeactivate(agent.id)}>
                        <PowerOff size={14} /> Deactivate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No agents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingAgent ? 'Edit Agent' : 'Create New Agent'}</h3>
              <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalContent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input 
                  label="Name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
                {!editingAgent && (
                  <>
                    <Input 
                      label="Email" 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      required 
                    />
                    <Input 
                      label="Password" 
                      type="password" 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      required 
                      minLength={8}
                    />
                  </>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input 
                    label="Latitude" 
                    type="number" 
                    step="0.0001"
                    value={formData.lat} 
                    onChange={(e) => setFormData({...formData, lat: parseFloat(e.target.value)})} 
                    required 
                  />
                  <Input 
                    label="Longitude" 
                    type="number" 
                    step="0.0001"
                    value={formData.lng} 
                    onChange={(e) => setFormData({...formData, lng: parseFloat(e.target.value)})} 
                    required 
                  />
                </div>
                
                {editingAgent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Current Zone</label>
                    <select 
                      value={formData.zoneId}
                      onChange={(e) => setFormData({...formData, zoneId: e.target.value})}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
                    >
                      <option value="">-- Unassigned / Auto Detect --</option>
                      {zones.map((zone: any) => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isAvailable} 
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                  <span>Is Available for Dispatch</span>
                </label>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">{editingAgent ? 'Save Changes' : 'Create Agent'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminAgentsPage;
