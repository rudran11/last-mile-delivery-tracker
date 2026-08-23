import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/ApiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Package, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { LogisticsNetworkBackground } from '../components/public/LogisticsNetworkBackground';
import styles from './LoginPage.module.css'; // Reuse login page layout

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

  const maskedEmail = email.replace(/(.{2})(.*)(?=@)/,
    (gp1, gp2, gp3) => gp2 + Array(gp3.length).join('*')
  );

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.brand} onClick={() => navigate('/')}>
            <Package className={styles.logoIcon} />
            <span>DeliveryTracker</span>
          </div>
          
          <div className={styles.heroText}>
            <h2>Join the next generation of logistics.</h2>
            <p>Create an account to experience geospatial dispatch, real-time lifecycle tracking, and comprehensive operational analytics.</p>
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

          {success ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
              <h2 className={styles.formTitle}>Email Verified</h2>
              <p className={styles.formSubtitle}>Redirecting to login...</p>
            </div>
          ) : step === 1 ? (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Create an account</h1>
                <p className={styles.formSubtitle}>Sign up to start shipping</p>
              </div>
              
              <form onSubmit={handleRegisterInit} className={styles.form}>
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
                
                <Button 
                  type="submit" 
                  className={styles.submitBtn} 
                  isLoading={isLoading}
                  size="lg"
                >
                  Create Account
                </Button>
                
                <div className={styles.signupPrompt}>
                  <span className={styles.signupText}>Already have an account?</span>
                  <a 
                    href="/login" 
                    className={styles.signupLink}
                    onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                  >
                    Sign in
                  </a>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className={styles.formHeader} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                  <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '1rem', borderRadius: '50%' }}>
                    <Mail size={32} color="var(--color-primary)" />
                  </div>
                </div>
                <h1 className={styles.formTitle}>Check your email</h1>
                <p className={styles.formSubtitle}>
                  We've sent a 6-digit verification code to<br/>
                  <strong>{maskedEmail}</strong>
                </p>
              </div>
              
              <form onSubmit={handleVerifyOtp} className={styles.form}>
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
                
                <Button 
                  type="submit" 
                  className={styles.submitBtn} 
                  isLoading={isLoading}
                  disabled={isLoading || otp.length !== 6}
                  size="lg"
                >
                  Verify Email
                </Button>
                
                <div className={styles.signupPrompt}>
                  <span className={styles.signupText}>Didn't receive the code?</span>
                  {cooldown > 0 ? (
                    <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>Resend in {cooldown}s</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className={styles.signupLink}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit' }}
                    >
                      Click to resend
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
