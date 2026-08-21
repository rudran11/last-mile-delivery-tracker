import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/ApiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './LoginPage.module.css';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.brand}>
          <Package className={styles.logoIcon} />
          <span>DeliveryTracker</span>
        </div>
        <Card className={styles.card}>
          <CardContent style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>Account Created</h2>
            <p style={{ color: 'var(--text-secondary)' }}>You are being redirected to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.brand}>
        <Package className={styles.logoIcon} />
        <span>DeliveryTracker</span>
      </div>
      
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <p className={styles.subtitle}>Sign up to start shipping</p>
        </CardHeader>
        
        <form onSubmit={handleRegister}>
          <CardContent className={styles.content}>
            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Email address"
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            
            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </CardContent>
          
          <CardFooter className={styles.footer} style={{ flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
            <Button 
              type="submit" 
              className={styles.submitBtn} 
              isLoading={isLoading}
            >
              Sign up
            </Button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Already have an account?</span>
              <Button 
                variant="outline" 
                type="button"
                onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                style={{ width: '100%' }}
              >
                Log in here
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
