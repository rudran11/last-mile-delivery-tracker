import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { api } from '../../services/ApiClient';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BarChart, Map, Box, Settings, CreditCard, PlusCircle, MessageSquare } from 'lucide-react';

interface NotificationRecord {
  id: string;
  orderId: string;
  order: { customer: { name: string, email: string } };
  channel: string;
  event: string;
  status: string;
  failureReason: string | null;
  createdAt: string;
  sentAt: string | null;
}

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <BarChart size={20} /> },
  { label: 'Communications', href: '/admin/notifications', icon: <MessageSquare size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <Map size={20} /> },
  { label: 'Order Ledger', href: '/admin/orders', icon: <Box size={20} /> },
  { label: 'Create Order', href: '/admin/orders/create', icon: <PlusCircle size={20} /> },
  { label: 'Geographic Zones', href: '/admin/configuration/zones', icon: <Settings size={20} /> },
  { label: 'Rate Cards', href: '/admin/configuration/rates', icon: <CreditCard size={20} /> },
];

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res: any = await api.get('/admin/notifications');
      setNotifications(res.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Outbound Communications</h1>
          <p className="mt-2 text-sm text-gray-400">
            Monitor system-generated notifications and their delivery status.
          </p>
        </div>

        {loading ? <div>Loading notifications...</div> : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Recipient</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {notifications.map((n) => (
                    <tr key={n.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(n.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {n.event}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {n.order?.customer?.name}<br/>
                        <span className="text-xs text-gray-500">{n.order?.customer?.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono text-xs">
                        {n.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          n.status === 'SENT' ? 'bg-green-100 text-green-800' :
                          n.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {n.status}
                        </span>
                        {n.failureReason && (
                          <p className="mt-1 text-xs text-red-400 truncate max-w-xs">{n.failureReason}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                  {notifications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No notifications generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
