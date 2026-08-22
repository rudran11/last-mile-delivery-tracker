import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import bcrypt from 'bcrypt';

describe('OTP Customer Registration', () => {
  const testEmail = `otp_test_${Date.now()}@example.com`;
  const password = 'StrongPassword123!';

  // Helpers to get OTP from db since email is mocked in tests
  const getOtpHash = async (email: string) => {
    const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
    return pending?.otpHash;
  };

  const getValidOtpForHash = async (email: string) => {
    // Brute force is impossible, but for tests we can't easily extract the plain OTP because it's not returned.
    // Wait, how do we test successful verification if we only store the hash and don't log the plain OTP?
    // In test environment, we might need a backdoor or we can mock bcrypt.hash?
    // Actually, we can just manually UPDATE the otpHash to a known bcrypt hash of '123456' to test the verify endpoint!
    const knownHash = await bcrypt.hash('123456', 10);
    await prisma.pendingRegistration.update({
      where: { email },
      data: { otpHash: knownHash }
    });
    return '123456';
  };

  it('OTP-01: Registration creates PendingRegistration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/init')
      .send({
        name: 'OTP Test',
        email: testEmail,
        password
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const pending = await prisma.pendingRegistration.findUnique({ where: { email: testEmail } });
    expect(pending).not.toBeNull();
    expect(pending?.name).toBe('OTP Test');
  });

  it('OTP-02: OTP is hashed and not stored plaintext', async () => {
    const pending = await prisma.pendingRegistration.findUnique({ where: { email: testEmail } });
    expect(pending?.otpHash).toBeDefined();
    // length of bcrypt hash is typically 60 chars
    expect(pending?.otpHash.length).toBe(60);
  });

  it('OTP-03: OTP is not returned in API response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/init')
      .send({
        name: 'Another Test',
        email: 'another@example.com',
        password
      });
    expect(res.body.data.otp).toBeUndefined();
    expect(res.body.data.otpHash).toBeUndefined();
  });

  it('OTP-05: Wrong OTP rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/verify')
      .send({
        email: testEmail,
        otp: '000000'
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('OTP-07: More than 5 attempts rejected', async () => {
    await prisma.pendingRegistration.update({
      where: { email: testEmail },
      data: { attempts: 5 }
    });

    const res = await request(app)
      .post('/api/v1/auth/register/verify')
      .send({
        email: testEmail,
        otp: '000000'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Maximum verification attempts exceeded');
  });

  it('OTP-08: Resend cooldown enforced', async () => {
    // It was just updated above, so updatedAt is very recent (< 60s)
    const res = await request(app)
      .post('/api/v1/auth/register/resend')
      .send({ email: testEmail });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Please wait before requesting a new OTP');
  });

  it('OTP-06: Expired OTP rejected', async () => {
    await prisma.pendingRegistration.update({
      where: { email: testEmail },
      data: { attempts: 0, expiresAt: new Date(Date.now() - 1000) } // Expired 1 second ago
    });

    const res = await request(app)
      .post('/api/v1/auth/register/verify')
      .send({
        email: testEmail,
        otp: '123456'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('OTP has expired');
  });

  it('OTP-04: Correct OTP creates CUSTOMER', async () => {
    // Reset expiration and set a known OTP hash for testing
    await prisma.pendingRegistration.update({
      where: { email: testEmail },
      data: { attempts: 0, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } 
    });
    
    const knownOtp = await getValidOtpForHash(testEmail);

    const res = await request(app)
      .post('/api/v1/auth/register/verify')
      .send({
        email: testEmail,
        otp: knownOtp
      });
      
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('CUSTOMER');
    
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).not.toBeNull();
    expect(user?.emailVerifiedAt).toBeDefined();
    
    // Pending registration should be removed
    const pending = await prisma.pendingRegistration.findUnique({ where: { email: testEmail } });
    expect(pending).toBeNull();
  });

  it('OTP-12: Verified customer can login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('OTP-13: Unverified/pending registration cannot login', async () => {
    const unverifiedEmail = `unverified_${Date.now()}@test.com`;
    await request(app).post('/api/v1/auth/register/init').send({ name: 'Unverified', email: unverifiedEmail, password });
    
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: unverifiedEmail, password });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Invalid email or password');
  });

  it('OTP-09: Duplicate email rejected', async () => {
    // testEmail was already verified and created as a User in OTP-04
    const res = await request(app)
      .post('/api/v1/auth/register/init')
      .send({ name: 'Duplicate', email: testEmail, password });
    expect(res.status).toBe(409);
  });

  it('OTP-10: ADMIN role injection rejected', async () => {
    const injectEmail = `admin_inject_${Date.now()}@test.com`;
    await request(app)
      .post('/api/v1/auth/register/init')
      .send({ name: 'Hacker', email: injectEmail, password, role: 'ADMIN' });
      
    const knownOtp = await getValidOtpForHash(injectEmail);
    const res = await request(app)
      .post('/api/v1/auth/register/verify')
      .send({ email: injectEmail, otp: knownOtp });
      
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('CUSTOMER'); // Stripped to CUSTOMER
  });

  it('OTP-11: AGENT role injection rejected', async () => {
    const injectEmail = `agent_inject_${Date.now()}@test.com`;
    await request(app)
      .post('/api/v1/auth/register/init')
      .send({ name: 'Hacker', email: injectEmail, password, role: 'AGENT' });
      
    const knownOtp = await getValidOtpForHash(injectEmail);
    const res = await request(app)
      .post('/api/v1/auth/register/verify')
      .send({ email: injectEmail, otp: knownOtp });
      
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('CUSTOMER'); // Stripped to CUSTOMER
  });
});
