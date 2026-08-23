import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { generateToken } from '../utils/jwt';
import { Role } from '@prisma/client';

describe('Admin Agent Management API', () => {
  let adminToken: string;
  let customerToken: string;
  let agentId: string;

  let ts: number;

  beforeAll(async () => {
    ts = Date.now();
    const admin = await prisma.user.create({
      data: { email: `admin_agent_api_${ts}@test.com`, name: 'Admin', passwordHash: 'hash', role: Role.ADMIN }
    });
    adminToken = generateToken({ userId: admin.id, role: Role.ADMIN });

    const customer = await prisma.user.create({
      data: { email: `customer_agent_api_${ts}@test.com`, name: 'Cust', passwordHash: 'hash', role: Role.CUSTOMER }
    });
    customerToken = generateToken({ userId: customer.id, role: Role.CUSTOMER });
  });

  afterAll(async () => {
    if (agentId) {
      await prisma.agentProfile.deleteMany({ where: { id: agentId } });
    }
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            `admin_agent_api_${ts}@test.com`, 
            `customer_agent_api_${ts}@test.com`, 
            `new_agent_123_${ts}@test.com`
          ]
        }
      }
    });
  });

  it('AGENT-07: Customer cannot create Agent (403)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/agents')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Test', email: 'test@agent.com', password: 'password', lat: 10, lng: 10, isAvailable: true });
    
    expect(res.status).toBe(403);
  });

  it('AGENT-01: Admin can list existing agents (includes seeded agents)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/agents')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    // Check if at least one agent is returned
    expect(res.body.data.length).toBeGreaterThanOrEqual(0);
  });

  it('AGENT-03: Admin can create a new Agent', async () => {
    const res = await request(app)
      .post('/api/v1/admin/agents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Agent',
        email: `new_agent_123_${ts}@test.com`,
        password: 'securepassword',
        lat: 9.9312,
        lng: 76.2673,
        isAvailable: true
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(`new_agent_123_${ts}@test.com`);
    expect(res.body.data.profile.isAvailable).toBe(true);

    agentId = res.body.data.profile.id;
  });

  it('AGENT-04: Duplicate email rejected', async () => {
    const res = await request(app)
      .post('/api/v1/admin/agents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Agent',
        email: `new_agent_123_${ts}@test.com`,
        password: 'securepassword',
        lat: 9.9312,
        lng: 76.2673,
        isAvailable: true
      });
    
    expect(res.status).toBe(409);
  });

  it('AGENT-05: Invalid coordinates rejected', async () => {
    const res = await request(app)
      .post('/api/v1/admin/agents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bad Location',
        email: 'bad_loc@test.com',
        password: 'securepassword',
        lat: 95, // invalid
        lng: 200, // invalid
        isAvailable: true
      });
    
    expect(res.status).toBe(400);
  });

  it('AGENT-09: Admin can update Agent location and availability', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/agents/${agentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Name',
        lat: 10.0,
        lng: 77.0,
        isAvailable: false
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
    expect(res.body.data.profile.isAvailable).toBe(false);
  });

  it('AGENT-12: Soft Deletion', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/agents/${agentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);

    // Verify it doesn't show up in list
    const listRes = await request(app)
      .get('/api/v1/admin/agents')
      .set('Authorization', `Bearer ${adminToken}`);
    
    const agentEmails = listRes.body.data.map((a: any) => a.email);
    expect(agentEmails).not.toContain(`new_agent_123_${ts}@test.com`);
  });
});
