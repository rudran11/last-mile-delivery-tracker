import React, { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/ApiClient';
import { Users, UserPlus, Edit2, MapPin, PowerOff, Activity, Search, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminAgentsPage.module.css';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const AdminAgentsPage = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', lat: 0, lng: 0, isAvailable: true, zoneId: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError('Fleet information could not be retrieved.');
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
    if (window.confirm('Are you sure you want to deactivate this agent? They will no longer receive assignments.')) {
      try {
        await api.delete(`/admin/agents/${id}`);
        loadData();
      } catch (err) {
        alert('Error deactivating agent');
      }
    }
  };

  // KPIs Calculation
  const totalAgentsCount = agents.length;
  const availableCount = agents.filter(a => a.isAvailable).length;
  const busyCount = agents.filter(a => !a.isAvailable).length;
  
  // Status Bar Calculation (Avoid division by zero)
  const availablePct = totalAgentsCount > 0 ? (availableCount / totalAgentsCount) * 100 : 0;
  const busyPct = totalAgentsCount > 0 ? (busyCount / totalAgentsCount) * 100 : 0;

  // Filtering Logic
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Search
      const searchMatch = !searchQuery || 
        agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        agent.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status
      let statusMatch = true;
      if (statusFilter === 'AVAILABLE') statusMatch = agent.isAvailable === true;
      if (statusFilter === 'BUSY') statusMatch = agent.isAvailable === false;
      
      // Zone
      let zoneMatch = true;
      if (zoneFilter !== 'ALL') zoneMatch = agent.zoneId === zoneFilter;

      return searchMatch && statusMatch && zoneMatch;
    });
  }, [agents, searchQuery, statusFilter, zoneFilter]);

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ marginTop: '4rem' }}>
          <EmptyState 
            title="Unable to load fleet data" 
            description={error}
            icon={<PowerOff size={48} />}
            action={<Button variant="primary" onClick={loadData}>Retry</Button>}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Fleet & Agents</h1>
            <p>Monitor agent availability, workload and delivery performance.</p>
          </div>
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

        {loading ? (
          <>
            <div className={styles.kpiStrip}>
              <Skeleton className={styles.kpiCard} style={{ height: '100px' }} />
              <Skeleton className={styles.kpiCard} style={{ height: '100px' }} />
              <Skeleton className={styles.kpiCard} style={{ height: '100px' }} />
            </div>
            <Skeleton className={styles.workspace} style={{ height: '400px' }} />
          </>
        ) : (
          <>
            {/* KPI Strip */}
            <div className={styles.kpiStrip}>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Total Agents</span>
                <span className={styles.kpiValue}>{totalAgentsCount}</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Available</span>
                <span className={styles.kpiValue} style={{ color: '#10B981' }}>{availableCount}</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Busy / Offline</span>
                <span className={styles.kpiValue} style={{ color: '#F59E0B' }}>{busyCount}</span>
              </div>
            </div>

            {/* Status Visualization */}
            <div className={styles.statusBarContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.statusBarLabel}>Fleet Utilization</span>
                <div className={styles.statusBarLegend}>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ backgroundColor: '#10B981' }} /> Available ({availablePct.toFixed(0)}%)
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ backgroundColor: '#F59E0B' }} /> Busy/Offline ({busyPct.toFixed(0)}%)
                  </div>
                </div>
              </div>
              <div className={styles.statusBar}>
                <div className={styles.statusAvailable} style={{ width: `${availablePct}%` }} />
                <div className={styles.statusBusy} style={{ width: `${busyPct}%` }} />
              </div>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className={styles.searchInput}
                  placeholder="Search agents..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
              <select 
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy / Offline</option>
              </select>
              <select 
                className={styles.filterSelect}
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
              >
                <option value="ALL">All Zones</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            {/* Main Workspace (Table) */}
            <div className={styles.workspace}>
              <div className={styles.tableContainer}>
                {filteredAgents.length > 0 ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Agent</th>
                        <th>Status</th>
                        <th>Zone</th>
                        <th>Location</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents.map((agent) => (
                        <tr key={agent.id}>
                          <td>
                            <div className={styles.agentCell}>
                              <div className={styles.avatar}>
                                {agent.name ? agent.name.substring(0, 2).toUpperCase() : 'AG'}
                              </div>
                              <div className={styles.agentInfo}>
                                <span className={styles.agentName}>{agent.name || 'Unknown'}</span>
                                <span className={styles.agentEmail}>{agent.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge variant={agent.isAvailable ? 'success' : 'warning'}>
                              {agent.isAvailable ? 'AVAILABLE' : 'BUSY / OFFLINE'}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant="outline">{agent.zoneName || 'Unassigned'}</Badge>
                          </td>
                          <td>
                            {agent.lat && agent.lng ? (
                              <div className={styles.locationCell}>
                                <MapPin size={14} />
                                {agent.lat.toFixed(4)}, {agent.lng.toFixed(4)}
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Unknown</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.actionCell} style={{ justifyContent: 'flex-end' }}>
                              <button 
                                className={styles.iconButton}
                                title="Edit Agent"
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
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className={styles.iconButton}
                                title="Agent Performance"
                                onClick={() => navigate(`/admin/agents/${agent.id}/performance`)}
                              >
                                <Activity size={16} />
                              </button>
                              <button 
                                className={`${styles.iconButton} ${styles.danger}`}
                                title="Deactivate Agent"
                                onClick={() => handleDeactivate(agent.id)}
                              >
                                <PowerOff size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '4rem 0' }}>
                    <EmptyState 
                      title="No agents found" 
                      description={agents.length === 0 ? "No agents are currently registered in the system." : "No agents match your current filters."}
                      icon={<Users size={48} />}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail / Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingAgent ? 'Edit Agent Profile' : 'Add New Agent'}</h2>
              <button className={styles.modalClose} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Agent Name</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  
                  {!editingAgent && (
                    <>
                      <div className={styles.formGroup}>
                        <label>Email Address</label>
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})} 
                          required 
                          placeholder="agent@company.com"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Temporary Password</label>
                        <input 
                          type="password" 
                          value={formData.password} 
                          onChange={(e) => setFormData({...formData, password: e.target.value})} 
                          required 
                          minLength={8}
                          placeholder="Min. 8 characters"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className={styles.formGroup}>
                    <label>Base Latitude</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={formData.lat} 
                      onChange={(e) => setFormData({...formData, lat: parseFloat(e.target.value)})} 
                      required 
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Base Longitude</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={formData.lng} 
                      onChange={(e) => setFormData({...formData, lng: parseFloat(e.target.value)})} 
                      required 
                    />
                  </div>
                  
                  {editingAgent && (
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Assigned Zone</label>
                      <select 
                        value={formData.zoneId}
                        onChange={(e) => setFormData({...formData, zoneId: e.target.value})}
                      >
                        <option value="">-- Unassigned / Auto Detect --</option>
                        {zones.map((zone: any) => (
                          <option key={zone.id} value={zone.id}>{zone.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <label className={styles.checkboxGroup}>
                      <input 
                        type="checkbox" 
                        checked={formData.isAvailable} 
                        onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                        style={{ width: 'auto' }}
                      />
                      <span>Agent is available for immediate dispatch</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">{editingAgent ? 'Save Profile' : 'Create Agent'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminAgentsPage;

