import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/ApiClient';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';
import { 
  ArrowLeft, MapPin, Activity, CheckCircle, XCircle, 
  Clock, Star, Package, MessageSquare, AlertTriangle, Users, Settings, BarChart, Box, PlusCircle, CreditCard
} from 'lucide-react';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <BarChart size={20} /> },
  { label: 'Fleet / Agents', href: '/admin/agents', icon: <Users size={20} /> },
  { label: 'Communications', href: '/admin/notifications', icon: <MessageSquare size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <MapPin size={20} /> },
  { label: 'Order Ledger', href: '/admin/orders', icon: <Box size={20} /> },
  { label: 'Create Order', href: '/admin/orders/create', icon: <PlusCircle size={20} /> },
  { label: 'Geographic Zones', href: '/admin/configuration/zones', icon: <Settings size={20} /> },
  { label: 'Rate Cards', href: '/admin/configuration/rates', icon: <CreditCard size={20} /> },
];

export const AgentPerformancePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'feedback'>('history');

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const response = await api.get<any>(`/admin/agents/${id}/performance`);
        setData(response);
      } catch (err: any) {
        setError(err.message || 'Failed to load agent performance data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerformance();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div style={{ padding: '2rem' }}>
          <Skeleton style={{ height: '40px', width: '200px', marginBottom: '2rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <Skeleton style={{ height: '120px' }} />
            <Skeleton style={{ height: '120px' }} />
            <Skeleton style={{ height: '120px' }} />
            <Skeleton style={{ height: '120px' }} />
          </div>
          <Skeleton style={{ height: '400px' }} />
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
          <Button onClick={() => navigate('/admin/agents')}>Return to Fleet</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { agent, metrics, currentAssignment, recentFeedback, deliveryHistory } = data;

  const renderStars = (rating: number) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={16}
          fill={rating >= star ? 'var(--color-warning)' : 'transparent'}
          color={rating >= star ? 'var(--color-warning)' : 'var(--color-border)'}
        />
      ))}
    </div>
  );

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/agents')} style={{ padding: 0, marginBottom: 'var(--space-2)' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Fleet
          </Button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 var(--space-2)' }}>
                {agent.name}
              </h1>
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-secondary)', alignItems: 'center' }}>
                <span>{agent.email}</span>
                <span>•</span>
                <Badge variant="outline">{agent.zoneName || 'No Zone'}</Badge>
                <span>•</span>
                <Badge variant={agent.isAvailable ? 'success' : 'warning'}>
                  {agent.isAvailable ? 'Available' : 'Busy'}
                </Badge>
                {!agent.isActive && <Badge variant="error">Deactivated</Badge>}
              </div>
            </div>
            {agent.lat && agent.lng && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>Last Known Location</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                  <MapPin size={16} />
                  <span>{agent.lat.toFixed(5)}, {agent.lng.toFixed(5)}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                <span>Completed Deliveries</span>
                <CheckCircle size={20} color="var(--color-success)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {metrics.completedDeliveries}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                out of {metrics.totalDeliveries} total attempts
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                <span>Failed Attempts</span>
                <XCircle size={20} color="var(--color-error)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {metrics.failedAttempts}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Failure rate: {metrics.totalDeliveries > 0 ? Math.round((metrics.failedAttempts / metrics.totalDeliveries) * 100) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                <span>Average Rating</span>
                <Star size={20} color="var(--color-warning)" fill="var(--color-warning)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : 'N/A'}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                based on {metrics.totalRatings} reviews
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                <span>Avg Delivery Time</span>
                <Clock size={20} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {metrics.averageDeliveryTimeMinutes > 0 ? `${metrics.averageDeliveryTimeMinutes}m` : 'N/A'}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                from assignment to completion
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section: Distribution & Current Assignment */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '0 1.5rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = metrics.ratingDistribution[stars] || 0;
                  const percentage = metrics.totalRatings > 0 ? Math.round((count / metrics.totalRatings) * 100) : 0;
                  return (
                    <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        {stars} ★
                      </div>
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: 'var(--color-warning)', borderRadius: '4px' }} />
                      </div>
                      <div style={{ width: '30px', textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Assignment</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '0 1.5rem 1.5rem' }}>
              {currentAssignment ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>Order #{currentAssignment.orderId.split('-')[0].toUpperCase()}</div>
                    <Badge variant={currentAssignment.status === 'IN_PROGRESS' ? 'success' : 'default'}>
                      {currentAssignment.status}
                    </Badge>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <MapPin size={16} color="var(--color-primary)" style={{ marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Pickup</div>
                        <div style={{ fontSize: 'var(--text-sm)' }}>{currentAssignment.pickupAddress}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <MapPin size={16} color="var(--color-success)" style={{ marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Drop-off</div>
                        <div style={{ fontSize: 'var(--text-sm)' }}>{currentAssignment.dropAddress}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Assigned: {format(new Date(currentAssignment.createdAt), 'PPpp')}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <Package size={32} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
                  <p>No active assignment at this time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Tabs for History & Feedback */}
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 1rem' }}>
            <button 
              onClick={() => setActiveTab('history')}
              style={{
                padding: '1rem', background: 'transparent', border: 'none', cursor: 'pointer',
                fontWeight: activeTab === 'history' ? 600 : 400,
                color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'history' ? '2px solid var(--color-primary)' : '2px solid transparent'
              }}
            >
              Delivery History
            </button>
            <button 
              onClick={() => setActiveTab('feedback')}
              style={{
                padding: '1rem', background: 'transparent', border: 'none', cursor: 'pointer',
                fontWeight: activeTab === 'feedback' ? 600 : 400,
                color: activeTab === 'feedback' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'feedback' ? '2px solid var(--color-primary)' : '2px solid transparent'
              }}
            >
              Customer Feedback
            </button>
          </div>
          <CardContent style={{ padding: 0 }}>
            {activeTab === 'history' ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '1rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Order ID</th>
                      <th style={{ padding: '1rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Route</th>
                      <th style={{ padding: '1rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Date</th>
                      <th style={{ padding: '1rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Status</th>
                      <th style={{ padding: '1rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Customer Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryHistory.map((hist: any) => (
                      <tr key={hist.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{hist.orderId.split('-')[0].toUpperCase()}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: 'var(--text-sm)' }}>{hist.orderPickup}</div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>↓ {hist.orderDrop}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: 'var(--text-sm)' }}>
                          {format(new Date(hist.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <Badge variant={hist.status === 'SUCCESS' ? 'success' : hist.status === 'FAILED' ? 'error' : 'default'}>
                            {hist.status}
                          </Badge>
                          {hist.failureReason && (
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                              {hist.failureReason}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {hist.rating ? renderStars(hist.rating) : <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Unrated</span>}
                        </td>
                      </tr>
                    ))}
                    {deliveryHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          No delivery history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {recentFeedback.map((fb: any) => (
                  <div key={fb.id} style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      {renderStars(fb.rating)}
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Order #{fb.order.id.split('-')[0].toUpperCase()} • {format(new Date(fb.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                    {fb.comment ? (
                      <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>"{fb.comment}"</p>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No comment provided.</p>
                    )}
                  </div>
                ))}
                {recentFeedback.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No customer feedback received yet.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AgentPerformancePage;
