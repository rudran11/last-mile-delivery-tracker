import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Package, PlusCircle, IndianRupee, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/ApiClient';
import { useNavigate } from 'react-router-dom';
import styles from './CreateOrderPage.module.css';

const navItems = [
  { label: 'Dashboard', href: '/customer', icon: <LayoutDashboard size={20} /> },
  { label: 'My Orders', href: '/customer/orders', icon: <Package size={20} /> },
  { label: 'Create Order', href: '/customer/orders/create', icon: <PlusCircle size={20} /> },
];

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState<any | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  
  const [formData, setFormData] = useState({
    pickupAddress: '',
    dropAddress: '',
    pickupZoneId: '',
    dropZoneId: '',
    length: '',
    breadth: '',
    height: '',
    actualWeight: '',
    orderType: 'B2C',
    paymentType: 'PREPAID'
  });

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await api.get<any[]>('/zones');
        setZones(response);
      } catch (err) {
        console.error('Failed to fetch zones', err);
      }
    };
    fetchZones();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setQuote(null); // Clear quote if data changes
  };

  const handleGetQuote = async () => {
    setIsQuoting(true);
    try {
      const payload = {
        ...formData,
        length: parseFloat(formData.length),
        breadth: parseFloat(formData.breadth),
        height: parseFloat(formData.height),
        actualWeight: parseFloat(formData.actualWeight),
      };
      
      const response = await api.post<any>('/orders/quote', payload);
      setQuote(response);
    } catch (err: any) {
      console.error('Failed to get quote', err);
      alert(err.message || 'Failed to get quote. Check your inputs.');
    } finally {
      setIsQuoting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        length: parseFloat(formData.length),
        breadth: parseFloat(formData.breadth),
        height: parseFloat(formData.height),
        actualWeight: parseFloat(formData.actualWeight),
      };
      
      const response = await api.post<{ id: string }>('/orders', payload, {
        headers: {
          'Idempotency-Key': crypto.randomUUID()
        }
      });
      
      navigate(`/customer/orders/${response.id}`);
    } catch (err: any) {
      console.error('Failed to create order', err);
      alert(err.message || 'Failed to create order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = formData.pickupAddress && formData.dropAddress && 
                         formData.pickupZoneId && formData.dropZoneId && 
                         formData.length && formData.breadth && 
                         formData.height && formData.actualWeight;

  return (
    <DashboardLayout navItems={navItems}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Create New Order</h1>
          <p className={styles.subtitle}>Enter shipment details for an instant quote.</p>
        </header>

        <div className={styles.layout}>
          <div className={styles.formSection}>
            <form onSubmit={(e) => e.preventDefault()}>
              <Card>
                <CardHeader>
                  <CardTitle>Locations</CardTitle>
                </CardHeader>
                <CardContent className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Pickup Zone</label>
                    <select name="pickupZoneId" value={formData.pickupZoneId} onChange={handleChange} className={styles.select}>
                      <option value="">Select Zone</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Drop Zone</label>
                    <select name="dropZoneId" value={formData.dropZoneId} onChange={handleChange} className={styles.select}>
                      <option value="">Select Zone</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>
                  
                  <Input 
                    label="Pickup Address" 
                    name="pickupAddress" 
                    value={formData.pickupAddress} 
                    onChange={handleChange} 
                    placeholder="Full pickup address"
                    className={styles.fullWidth}
                  />
                  
                  <Input 
                    label="Drop Address" 
                    name="dropAddress" 
                    value={formData.dropAddress} 
                    onChange={handleChange} 
                    placeholder="Full delivery address"
                    className={styles.fullWidth}
                  />
                </CardContent>
              </Card>

              <Card className={styles.cardSpacing}>
                <CardHeader>
                  <CardTitle>Package Details</CardTitle>
                </CardHeader>
                <CardContent className={styles.formGrid3}>
                  <Input label="Length (cm)" name="length" type="number" min="0.1" step="0.1" value={formData.length} onChange={handleChange} />
                  <Input label="Breadth (cm)" name="breadth" type="number" min="0.1" step="0.1" value={formData.breadth} onChange={handleChange} />
                  <Input label="Height (cm)" name="height" type="number" min="0.1" step="0.1" value={formData.height} onChange={handleChange} />
                  <Input label="Actual Weight (kg)" name="actualWeight" type="number" min="0.1" step="0.1" value={formData.actualWeight} onChange={handleChange} />
                </CardContent>
              </Card>

              <Card className={styles.cardSpacing}>
                <CardHeader>
                  <CardTitle>Service Preferences</CardTitle>
                </CardHeader>
                <CardContent className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Order Type</label>
                    <select name="orderType" value={formData.orderType} onChange={handleChange} className={styles.select}>
                      <option value="B2C">B2C</option>
                      <option value="B2B">B2B</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Payment Method</label>
                    <select name="paymentType" value={formData.paymentType} onChange={handleChange} className={styles.select}>
                      <option value="PREPAID">Prepaid</option>
                      <option value="COD">Cash on Delivery (COD)</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="button" 
                    onClick={handleGetQuote} 
                    disabled={!isFormComplete || isQuoting}
                    isLoading={isQuoting}
                    style={{ width: '100%' }}
                  >
                    Calculate Price
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>

          <div className={styles.quoteSection}>
            <Card className={styles.stickyQuote}>
              <CardHeader>
                <CardTitle>Pricing Quote</CardTitle>
              </CardHeader>
              <CardContent>
                {!quote ? (
                  <div className={styles.emptyQuote}>
                    <IndianRupee size={32} className={styles.emptyIcon} />
                    <p>Fill in shipment details to calculate price.</p>
                  </div>
                ) : (
                  <div className={styles.quoteDetails}>
                    <div className={styles.quoteRow}>
                      <span>Billable Weight</span>
                      <strong>{quote.billableWeight} kg</strong>
                    </div>
                    <div className={styles.quoteRow}>
                      <span>Base Charge</span>
                      <span>₹{quote.baseCharge}</span>
                    </div>
                    {quote.appliedCodSurcharge > 0 && (
                      <div className={styles.quoteRow}>
                        <span>COD Surcharge</span>
                        <span>₹{quote.appliedCodSurcharge}</span>
                      </div>
                    )}
                    <hr className={styles.divider} />
                    <div className={styles.quoteTotalRow}>
                      <span>Total</span>
                      <span className={styles.quoteTotal}>₹{quote.finalCharge}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!quote || isSubmitting}
                  isLoading={isSubmitting}
                  style={{ width: '100%' }}
                >
                  Confirm & Create Order
                  <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateOrderPage;
