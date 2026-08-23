import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/ApiClient';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';
import { ArrowLeft, Map as MapIcon, Users, MessageSquare, Box, PlusCircle, Settings, CreditCard, Clock, Activity, Target, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <Target size={20} /> },
  { label: 'Fleet / Agents', href: '/admin/agents', icon: <Users size={20} /> },
  { label: 'Communications', href: '/admin/notifications', icon: <MessageSquare size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <MapIcon size={20} /> },
  { label: 'Order Ledger', href: '/admin/orders', icon: <Box size={20} /> },
  { label: 'Create Order', href: '/admin/orders/create', icon: <PlusCircle size={20} /> },
  { label: 'Geographic Zones', href: '/admin/configuration/zones', icon: <Settings size={20} /> },
  { label: 'Rate Cards', href: '/admin/configuration/rates', icon: <CreditCard size={20} /> },
];

const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

export const DispatchExplanationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        const response = await api.get<any>(`/admin/orders/${id}/dispatch-explanation`);
        setData(response);
      } catch (err: any) {
        setError(err.message || 'Failed to load dispatch explanation');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExplanation();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div style={{ padding: '2rem' }}>
          <Skeleton style={{ height: '40px', width: '200px', marginBottom: '2rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <Skeleton style={{ height: '500px' }} />
            <Skeleton style={{ height: '500px' }} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout navItems={navItems}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--color-error)" style={{ margin: '0 auto 1rem' }} />
          <h2>Error Loading Data</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>{error}</p>
          <Button onClick={() => navigate('/admin/dispatch')}>Return to Dispatch Panel</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { order, historicalAssignment, liveAnalysis, timeline } = data;
  
  // Calculate map center
  const centerLat = order.pickupLat || 0;
  const centerLng = order.pickupLng || 0;

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ padding: 0, marginBottom: 'var(--space-2)' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back
          </Button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 var(--space-2)' }}>
                Dispatch Intelligence
              </h1>
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-secondary)', alignItems: 'center' }}>
                <span>Order #{order.id.split('-')[0].toUpperCase()}</span>
                <span>•</span>
                <Badge variant={order.status === 'PENDING' ? 'warning' : 'success'}>
                  {order.status}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', 
                      ...(window.innerWidth > 1024 && { gridTemplateColumns: '1fr 1fr' }) }}>
          
          {/* Left Column: Data & Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Historical Assignment (If any) */}
            {historicalAssignment && (
              <Card style={{ borderColor: 'var(--color-success)' }}>
                <CardHeader style={{ paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <CardTitle style={{ color: 'var(--color-success)' }}>ASSIGNMENT RECORD</CardTitle>
                    <Badge variant="success">Historical</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>
                    This order was assigned to the following agent.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-success-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{historicalAssignment.agentName}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {historicalAssignment.agentZone || 'No Zone'} • {historicalAssignment.method}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Assigned at</div>
                      <div style={{ fontWeight: 600 }}>{format(new Date(historicalAssignment.timestamp), 'MMM d, p')}</div>
                    </div>
                  </div>
                  {historicalAssignment.distanceAtTime !== null && (
                    <div style={{ marginTop: '1rem', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={16} color="var(--color-text-secondary)" />
                      <span>Recorded distance at time of assignment: <strong>{(historicalAssignment.distanceAtTime / 1000).toFixed(2)} km</strong></span>
                    </div>
                  )}
                  <div style={{ marginTop: '1rem' }}>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/agents/${historicalAssignment.agentId}/performance`)}>
                      View Agent Performance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Fleet Analysis */}
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CardTitle>CURRENT FLEET ANALYSIS</CardTitle>
                  {!historicalAssignment && <Badge variant="warning">Live Dispatch Analysis</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>
                  {liveAnalysis.explanation}
                </p>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.75rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>AGENT</th>
                        <th style={{ padding: '0.75rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>ZONE</th>
                        <th style={{ padding: '0.75rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>DISTANCE</th>
                        <th style={{ padding: '0.75rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveAnalysis.candidates.map((candidate: any) => (
                        <tr key={candidate.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: candidate.isNearest && !historicalAssignment ? 'var(--color-success-bg)' : 'transparent' }}>
                          <td style={{ padding: '0.75rem', fontSize: 'var(--text-sm)', fontWeight: candidate.isNearest ? 600 : 400 }}>
                            {candidate.name}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: 'var(--text-sm)' }}>
                            {candidate.zone || '-'}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: 'var(--text-sm)' }}>
                            {candidate.distance !== null ? `${(candidate.distance / 1000).toFixed(2)} km` : '-'}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {candidate.status === 'ELIGIBLE' && candidate.isNearest && !historicalAssignment ? (
                              <Badge variant="success">Likely Choice</Badge>
                            ) : candidate.status === 'ELIGIBLE' ? (
                              <Badge variant="outline">Eligible</Badge>
                            ) : (
                              <Badge variant="default">{candidate.reason}</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                      {liveAnalysis.candidates.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            No agents found with valid coordinates.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Dispatch Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--color-border)' }} />
                  {timeline.map((event: any, idx: number) => (
                    <div key={event.id} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-surface)',
                        border: '2px solid', borderColor: event.event.includes('ASSIGN') ? 'var(--color-success)' : 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: event.event.includes('ASSIGN') ? 'var(--color-success)' : 'var(--color-primary)' }} />
                      </div>
                      <div style={{ flex: 1, paddingBottom: idx !== timeline.length - 1 ? '1rem' : 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                          {event.event.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {format(new Date(event.timestamp), 'PPpp')}
                        </div>
                        {event.metadata && event.metadata.distance && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            Distance calculated: {(event.metadata.distance / 1000).toFixed(2)} km
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {timeline.length === 0 && (
                    <div style={{ paddingLeft: '2rem', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      No tracking events recorded.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Map */}
          <div>
            <Card style={{ position: 'sticky', top: '2rem', height: 'calc(100vh - 8rem)' }}>
              <CardHeader>
                <CardTitle>Visual Dispatch Map</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: 0, height: 'calc(100% - 60px)', position: 'relative' }}>
                {centerLat && centerLng ? (
                  <MapContainer 
                    center={[centerLat, centerLng]} 
                    zoom={12} 
                    style={{ height: '100%', width: '100%', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Pickup Marker */}
                    <Marker position={[order.pickupLat, order.pickupLng]} icon={createMarkerIcon('var(--color-primary)')}>
                      <Popup>
                        <strong>Pickup</strong><br/>
                        {order.pickupAddress}
                      </Popup>
                    </Marker>
                    
                    {/* Drop Marker */}
                    {order.dropLat && order.dropLng && (
                      <>
                        <Marker position={[order.dropLat, order.dropLng]} icon={createMarkerIcon('var(--color-error)')}>
                          <Popup>
                            <strong>Drop-off</strong><br/>
                            {order.dropAddress}
                          </Popup>
                        </Marker>
                        <Polyline positions={[[order.pickupLat, order.pickupLng], [order.dropLat, order.dropLng]]} color="var(--color-border)" dashArray="5, 10" />
                      </>
                    )}

                    {/* Agent Markers */}
                    {liveAnalysis.candidates.map((agent: any) => {
                      if (!agent.lat || !agent.lng) return null;
                      
                      let color = 'var(--color-border)'; // default gray for excluded
                      if (agent.status === 'ELIGIBLE') {
                        color = agent.isNearest ? 'var(--color-success)' : 'var(--color-primary-light)';
                      }
                      
                      // If historical, highlight the actually assigned agent instead of the 'nearest'
                      if (historicalAssignment && historicalAssignment.agentId === agent.id) {
                        color = 'var(--color-success)';
                      }

                      return (
                        <Marker key={agent.id} position={[agent.lat, agent.lng]} icon={createMarkerIcon(color)}>
                          <Popup>
                            <div style={{ minWidth: '150px' }}>
                              <strong style={{ display: 'block', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '4px' }}>
                                {agent.name}
                              </strong>
                              <div style={{ fontSize: '12px' }}>
                                <div><strong>Zone:</strong> {agent.zone || 'None'}</div>
                                <div><strong>Distance:</strong> {(agent.distance / 1000).toFixed(2)} km</div>
                                <div style={{ marginTop: '4px' }}>
                                  {historicalAssignment && historicalAssignment.agentId === agent.id ? (
                                    <Badge variant="success">Historcially Assigned</Badge>
                                  ) : (
                                    <Badge variant={agent.status === 'ELIGIBLE' ? 'outline' : 'default'}>{agent.status === 'EXCLUDED' ? agent.reason : agent.status}</Badge>
                                  )}
                                </div>
                                <div style={{ marginTop: '8px' }}>
                                  <Button size="sm" style={{ width: '100%', fontSize: '10px', padding: '4px' }} onClick={() => navigate(`/admin/agents/${agent.id}/performance`)}>
                                    View Performance
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                    Map coordinates unavailable for this order.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default DispatchExplanationPage;
