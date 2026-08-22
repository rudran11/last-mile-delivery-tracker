import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/ApiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Package, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import styles from './LoginPage.module.css';

const RegisterPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [cooldown, setCooldown] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRegisterInit = async (e: React.FormEvent) => {
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
      await api.post('/auth/register/init', { name, email, password });
      setStep(2);
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register/verify', { email, otp });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/register/resend', { email });
      setCooldown(60);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
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
            <h2 style={{ marginBottom: '0.5rem' }}>Email Verified Successfully</h2>
            <p style={{ color: 'var(--text-secondary)' }}>You are being redirected to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maskedEmail = email.replace(/(.{2})(.*)(?=@)/,
    (gp1, gp2, gp3) => gp2 + Array(gp3.length).join('*')
  );

  return (
    <div className={styles.container}>
      <div className={styles.brand}>
        <Package className={styles.logoIcon} />
        <span>DeliveryTracker</span>
      </div>
      
      <Card className={styles.card}>
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <p className={styles.subtitle}>Sign up to start shipping</p>
            </CardHeader>
            
            <form onSubmit={handleRegisterInit}>
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
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </CardContent>
              
              <CardFooter className={styles.footer}>
                <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                  {isLoading ? 'Sending Verification...' : 'Create Account'}
                </Button>
                <p className={styles.registerLink}>
                  Already have an account? <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign in</a>
                </p>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ backgroundColor: 'var(--surface-active)', padding: '1rem', borderRadius: '50%' }}>
                  <Mail size={32} color="var(--primary)" />
                </div>
              </div>
              <CardTitle>Check your email</CardTitle>
              <p className={styles.subtitle}>
                We've sent a 6-digit verification code to<br/>
                <strong>{maskedEmail}</strong>
              </p>
            </CardHeader>
            
            <form onSubmit={handleVerifyOtp}>
              <CardContent className={styles.content}>
                {error && (
                  <div className={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                
                <Input
                  label="Verification Code"
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.25em' }}
                />
              </CardContent>
              
              <CardFooter className={styles.footer} style={{ flexDirection: 'column', gap: '1rem' }}>
                <Button type="submit" variant="primary" fullWidth disabled={isLoading || otp.length !== 6}>
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>
                
                <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Didn't receive the code?{' '}
                  {cooldown > 0 ? (
                    <span>Resend in {cooldown}s</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      style={{ 
                        background: 'none', border: 'none', color: 'var(--primary)', 
                        fontWeight: '500', cursor: 'pointer', padding: 0 
                      }}
                    >
                      Click to resend
                    </button>
                  )}
                </div>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default RegisterPage;
