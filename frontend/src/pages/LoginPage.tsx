import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/ApiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Package, AlertCircle } from 'lucide-react';
import { LogisticsNetworkBackground } from '../components/public/LogisticsNetworkBackground';
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
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.brand} onClick={() => navigate('/')}>
            <Package className={styles.logoIcon} />
            <span>DeliveryTracker</span>
          </div>
          
          <div className={styles.heroText}>
            <h2>Intelligent logistics starts here.</h2>
            <p>Geospatial dispatch, real-time lifecycle tracking, and comprehensive operational analytics in one unified platform.</p>
          </div>
          
          <div className={styles.testAccounts}>
            <p className={styles.testAccountsTitle}>Test Accounts</p>
            <div className={styles.testAccountGrid}>
              <div className={styles.testAccountItem}>
                <span className={styles.testRole}>Admin</span>
                <span className={styles.testCred}>admin@unthinkable.co / admin123</span>
              </div>
              <div className={styles.testAccountItem}>
                <span className={styles.testRole}>Customer</span>
                <span className={styles.testCred}>customer@unthinkable.co / customer123</span>
              </div>
              <div className={styles.testAccountItem}>
                <span className={styles.testRole}>Agent</span>
                <span className={styles.testCred}>agent1@unthinkable.co / agent123</span>
              </div>
            </div>
          </div>
        </div>
        <LogisticsNetworkBackground />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.mobileBrand} onClick={() => navigate('/')}>
            <Package className={styles.logoIcon} />
            <span>DeliveryTracker</span>
          </div>

          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formSubtitle}>Sign in to your account to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className={styles.form}>
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
              className={styles.inputField}
            />
            
            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={styles.inputField}
            />
            
            <Button 
              type="submit" 
              className={styles.submitBtn} 
              isLoading={isLoading}
              size="lg"
            >
              Sign in
            </Button>
            
            <div className={styles.signupPrompt}>
              <span className={styles.signupText}>Don't have an account?</span>
              <a 
                href="/register" 
                className={styles.signupLink}
                onClick={(e) => { e.preventDefault(); navigate('/register'); }}
              >
                Sign up
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
