import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/ApiClient';
import { useNavigate } from 'react-router-dom';
import { Map, Layers, ClipboardList, Settings } from 'lucide-react';

const navItems = [
  { label: 'Control Tower', href: '/admin', icon: <Map size={20} /> },
  { label: 'Dispatch Panel', href: '/admin/dispatch', icon: <Layers size={20} /> },
  { label: 'Global Orders', href: '/admin/orders', icon: <ClipboardList size={20} /> },
  { label: 'Zones & Areas', href: '/admin/configuration/zones', icon: <Map size={20} /> },
  { label: 'Rate Cards', href: '/admin/configuration/rates', icon: <Settings size={20} /> },
];

const AdminCreateOrderPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerId: '',
    pickupAddress: '',
    pickupLat: '',
    pickupLng: '',
    pickupPincode: '',
    dropAddress: '',
    dropLat: '',
    dropLng: '',
    orderType: 'B2C',
    paymentType: 'PREPAID',
    length: '',
    breadth: '',
    height: '',
    actualWeight: '',
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch users with CUSTOMER role for the dropdown
    // We do not have a listUsers endpoint right now, so we can just use a text input for customerId
    // Or we could build a quick search if needed. For now, text input.
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idempotencyKey = crypto.randomUUID();
      await api.post('/admin/orders', {
        customerId: formData.customerId,
        pickupAddress: formData.pickupAddress,
        pickupLat: Number(formData.pickupLat),
        pickupLng: Number(formData.pickupLng),
        pickupPincode: formData.pickupPincode,
        dropAddress: formData.dropAddress,
        dropLat: Number(formData.dropLat),
        dropLng: Number(formData.dropLng),
        orderType: formData.orderType,
        paymentType: formData.paymentType,
        length: Number(formData.length),
        breadth: Number(formData.breadth),
        height: Number(formData.height),
        actualWeight: Number(formData.actualWeight),
      }, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      alert('Order created successfully!');
      navigate('/admin/orders');
    } catch (err: any) {
      alert(`Failed to create order: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Admin Order Creation
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Create an order on behalf of a customer.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Customer ID</label>
                <Input name="customerId" value={formData.customerId} onChange={handleChange} required placeholder="UUID of the Customer" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Pickup Address</label>
                  <Input name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Pickup Pincode</label>
                  <Input name="pickupPincode" value={formData.pickupPincode} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Pickup Lat</label>
                  <Input type="number" step="any" name="pickupLat" value={formData.pickupLat} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Pickup Lng</label>
                  <Input type="number" step="any" name="pickupLng" value={formData.pickupLng} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Drop Address</label>
                  <Input name="dropAddress" value={formData.dropAddress} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Drop Lat</label>
                  <Input type="number" step="any" name="dropLat" value={formData.dropLat} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Drop Lng</label>
                  <Input type="number" step="any" name="dropLng" value={formData.dropLng} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Order Type</label>
                  <select name="orderType" value={formData.orderType} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                    <option value="B2C">B2C</option>
                    <option value="B2B">B2B</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Payment Type</label>
                  <select name="paymentType" value={formData.paymentType} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                    <option value="PREPAID">Prepaid</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Length (cm)</label>
                  <Input type="number" name="length" value={formData.length} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Breadth (cm)</label>
                  <Input type="number" name="breadth" value={formData.breadth} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Height (cm)</label>
                  <Input type="number" name="height" value={formData.height} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Weight (kg)</label>
                  <Input type="number" name="actualWeight" value={formData.actualWeight} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit">Create Order</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminCreateOrderPage;
