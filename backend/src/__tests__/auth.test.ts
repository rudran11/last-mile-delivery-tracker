import request from 'supertest';
import app from '../app';
import { prisma } from './setup';

describe('Auth Registration API', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: ['newcustomer@test.com', 'adminattempt@test.com', 'missing@test.com'] } } });
  });

  it('should register a new customer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'New Customer',
        email: 'newcustomer@test.com',
        password: 'securepassword123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Account created successfully');
    expect(res.body.data.user.email).toBe('newcustomer@test.com');
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.user.name).toBe('New Customer');
    
    // Check DB
    const dbUser = await prisma.user.findUnique({ where: { email: 'newcustomer@test.com' } });
    expect(dbUser).toBeTruthy();
    expect(dbUser?.role).toBe('CUSTOMER');
    expect(dbUser?.passwordHash).not.toBe('securepassword123'); // must be hashed
  });

  it('should prevent duplicate registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate',
        email: 'newcustomer@test.com', // same email
        password: 'securepassword123',
      });

    expect(res.status).toBe(409); // Conflict
  });

  it('should reject invalid role (ADMIN)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Admin Attempt',
        email: 'adminattempt@test.com',
        password: 'securepassword123',
        role: 'ADMIN',
      });

    expect(res.status).toBe(400); // Bad Request (Zod validation failure)
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'missing@test.com',
      });

    expect(res.status).toBe(400);
  });
});
