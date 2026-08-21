import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/ApiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Package, AlertCircle } from 'lucide-react';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const from = location.state?.from?.pathname;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post<{ token: string; user: any }>('/auth/login', { email, password });
      
      login(response.token, response.user);
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        // Redirect based on role
        const role = response.user.role;
        if (role === 'ADMIN') navigate('/admin', { replace: true });
        else if (role === 'AGENT') navigate('/agent', { replace: true });
        else navigate('/customer', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.brand}>
        <Package className={styles.logoIcon} />
        <span>DeliveryTracker</span>
      </div>
      
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <p className={styles.subtitle}>Enter your credentials to access the platform</p>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className={styles.content}>
            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
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
          </CardContent>
          
          <CardFooter className={styles.footer}>
            <Button 
              type="submit" 
              className={styles.submitBtn} 
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className={styles.testAccounts}>
        <p>Test Accounts:</p>
        <ul>
          <li>Admin: admin@unthinkable.co (admin123)</li>
          <li>Customer: customer@unthinkable.co (customer123)</li>
          <li>Agent: agent1@unthinkable.co (agent123)</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginPage;
