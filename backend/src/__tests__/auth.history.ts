import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import bcrypt from 'bcrypt';

describe('Auth Login API', () => {
  beforeAll(async () => {
    const hash = await bcrypt.hash('securepassword123', 10);
    await prisma.user.upsert({
      where: { email: 'logintest@test.com' },
      update: { passwordHash: hash },
      create: {
        name: 'Login Test',
        email: 'logintest@test.com',
        passwordHash: hash,
        role: 'CUSTOMER'
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'logintest@test.com' }
    });
  });

  it('should login a valid customer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'logintest@test.com',
        password: 'securepassword123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('logintest@test.com');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'logintest@test.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });
});
