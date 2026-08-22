import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LayoutDashboard, Package, PlusCircle, IndianRupee, ArrowRight, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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

const LocationSearch = ({ label, onSelect, placeholder, error }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState(false);
  const [selectedData, setSelectedData] = useState<{lat: number, lng: number} | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' }
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (r: any) => {
    setQuery(r.display_name);
    setSelected(true);
    setSelectedData({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setResults([]);
    const postcode = r.address?.postcode || '';
    onSelect(r.display_name, parseFloat(r.lat), parseFloat(r.lon), postcode);
  };

  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          value={query} 
          onChange={e => { setQuery(e.target.value); setSelected(false); setSelectedData(null); onSelect('', 0, 0); }} 
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(e); }}
          placeholder={placeholder}
          style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`, backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        />
        <Button onClick={handleSearch} isLoading={isSearching} disabled={selected || !query} type="button" variant="outline">Search</Button>
      </div>
      {results.length > 0 && !selected && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto', boxShadow: 'var(--shadow-md)', marginTop: '4px' }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => selectLocation(r)} style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
              {r.display_name}
            </div>
          ))}
        </div>
      )}
      {selectedData && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={12} />
          Location fixed: Lat {selectedData.lat.toFixed(4)}, Lng {selectedData.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
};

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState<any | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  
  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickupLat: 0,
    pickupLng: 0,
    pickupPincode: '',
    dropAddress: '',
    dropLat: 0,
    dropLng: 0,
    dropPincode: '',
    length: '',
    breadth: '',
    height: '',
    actualWeight: '',
    orderType: 'B2C',
    paymentType: 'PREPAID'
  });

  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setQuote(null);
  };

  const handleLocationSelect = (type: 'pickup' | 'drop') => (address: string, lat: number, lng: number, pincode: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Address`]: address,
      [`${type}Lat`]: lat,
      [`${type}Lng`]: lng,
      [`${type}Pincode`]: pincode || '',
    }));
    setQuote(null);
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
      
      const response = await api.post<any>('/orders', payload, {
        headers: {
          'Idempotency-Key': crypto.randomUUID()
        }
      });
      
      navigate(`/customer/orders/${response.id}?created=true`);
    } catch (err: any) {
      console.error('Failed to create order', err);
      alert(err.message || 'Failed to create order.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const isFormComplete = formData.pickupAddress && formData.dropAddress && 
                         formData.pickupLat !== 0 && formData.dropLat !== 0 &&
                         formData.length && formData.breadth && 
                         formData.height && formData.actualWeight;

  return (
    <DashboardLayout navItems={navItems}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Create New Order</h1>
          <p className={styles.subtitle}>Enter shipment details and locations for an instant quote.</p>
        </header>

        <div className={styles.layout}>
          <div className={styles.formSection}>
            <form onSubmit={(e) => e.preventDefault()}>
              <Card>
                <CardHeader>
                  <CardTitle>Locations</CardTitle>
                </CardHeader>
                <CardContent className={styles.formGrid}>
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-primary)' }}>ℹ️</span>
                      Our logistics network now supports automatic serviceability for all valid locations across India.
                    </div>
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <LocationSearch 
                      label="Pickup Location" 
                      placeholder="Search for pickup address (e.g. Connaught Place, Delhi)"
                      onSelect={handleLocationSelect('pickup')}
                      error={!formData.pickupAddress}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <LocationSearch 
                      label="Drop Location" 
                      placeholder="Search for delivery address (e.g. Andheri, Mumbai)"
                      onSelect={handleLocationSelect('drop')}
                      error={!formData.dropAddress}
                    />
                  </div>
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
                    <p>Fill in shipment details and complete location search to calculate price.</p>
                  </div>
                ) : (
                  <div className={styles.quoteDetails}>
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Pickup</span>
                        <strong style={{ textAlign: 'right' }}>{quote.pickupArea?.name} ({quote.pickupArea?.pincode})<br/><span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{quote.pickupZone?.name}</span></strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Drop</span>
                        <strong style={{ textAlign: 'right' }}>{quote.dropArea?.name} ({quote.dropArea?.pincode})<br/><span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{quote.dropZone?.name}</span></strong>
                      </div>
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: quote.zoneRelationship === 'INTRA_ZONE' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {quote.zoneRelationship.replace('_', ' ')}
                      </div>
                    </div>
                    <div className={styles.quoteRow}>
                      <span>Billable Weight</span>
                      <strong>{quote.billableWeight} kg</strong>
                    </div>
                    <div className={styles.quoteRow}>
                      <span>Base Charge</span>
                      <span>₹{quote.baseCharge}</span>
                    </div>
                    <div className={styles.quoteRow}>
                      <span>Payment Method</span>
                      <strong>{formData.paymentType}</strong>
                    </div>
                    <div className={styles.quoteRow}>
                      <span>Order Type</span>
                      <strong>{formData.orderType}</strong>
                    </div>
                    <div className={styles.quoteRow}>
                      <span>COD Surcharge {formData.paymentType === 'COD' ? `(${formData.orderType})` : ''}</span>
                      <span>₹{formData.paymentType === 'PREPAID' ? '0' : quote.appliedCodSurcharge}</span>
                    </div>
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
