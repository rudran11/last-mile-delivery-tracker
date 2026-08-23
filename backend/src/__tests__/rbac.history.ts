import request from 'supertest';
import app from '../app';
import { TestFactory } from './factories/TestFactory';
import { generateToken } from '../utils/jwt';

describe('RBAC & Security Constraints', () => {
  let adminToken: string;
  let agentToken: string;
  let customerToken: string;

  beforeAll(async () => {
    const admin = await TestFactory.createUser('ADMIN', 'rbac_admin');
    const agent = await TestFactory.createUser('AGENT', 'rbac_agent');
    const cust = await TestFactory.createUser('CUSTOMER', 'rbac_cust');

    adminToken = generateToken({ userId: admin.id, role: 'ADMIN' });
    agentToken = generateToken({ userId: agent.id, role: 'AGENT' });
    customerToken = generateToken({ userId: cust.id, role: 'CUSTOMER' });
  });

  afterAll(async () => {
    await TestFactory.cleanup();
  });

  it('RBAC-01: CUSTOMER cannot access ADMIN routes', async () => {
    const res = await request(app).get('/api/v1/admin/agents').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('RBAC-02: AGENT cannot access ADMIN routes', async () => {
    const res = await request(app).get('/api/v1/admin/orders').set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(403);
  });

  it('RBAC-03: CUSTOMER cannot access AGENT routes', async () => {
    const res = await request(app).put('/api/v1/agents/status').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('RBAC-04: AGENT cannot access CUSTOMER order ledger', async () => {
    const res = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(403);
  });

  it('RBAC-05: Missing JWT rejected (401)', async () => {
    const res = await request(app).get('/api/v1/orders');
    expect(res.status).toBe(401);
  });

  it('RBAC-06: Invalid JWT signature rejected (401)', async () => {
    const res = await request(app).get('/api/v1/orders').set('Authorization', `Bearer invalid.token.here`);
    expect(res.status).toBe(401);
  });
});
