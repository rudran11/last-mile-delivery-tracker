import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { TestFactory } from './factories/TestFactory';
import { MockEmailProvider } from '../services/providers/MockEmailProvider';
import bcrypt from 'bcrypt';

jest.mock('../services/NotificationService', () => ({
  NotificationService: { emit: async () => true }
}));

describe('End-to-End Lifecycle', () => {
  let customerEmail = `e2e_cust_${Date.now()}@test.com`;
  let customerPassword = 'SecurePassword123!';
  let customerToken: string;
  let customerId: string;
  
  let agentEmail = `e2e_agent_${Date.now()}@test.com`;
  let agentToken: string;
  let agentProfileId: string;

  let orderId: string;
  let zoneId: string;

  beforeAll(async () => {
    // Need a test zone
    const z = await TestFactory.createZone('E2E North Zone'); // We will test Delhi
    zoneId = z.id;
    await TestFactory.createRateConfiguration();

    // Create Agent in North Zone
    const hash = await bcrypt.hash('agentpass', 10);
    const agentUser = await prisma.user.create({
      data: { email: agentEmail, name: 'E2E Agent', passwordHash: hash, role: 'AGENT' }
    });
    TestFactory.createdUserIds.push(agentUser.id);
    const ap = await prisma.agentProfile.create({
      data: { userId: agentUser.id, currentZoneId: zoneId, isAvailable: true }
    });
    agentProfileId = ap.id;
    // Set agent to Delhi
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(77.2, 28.6), 4326) WHERE id = ${ap.id}`;
    
    // Login Agent
    const res = await request(app).post('/api/v1/auth/login').send({ email: agentEmail, password: 'agentpass' });
    agentToken = res.body.data.token;

    MockEmailProvider.getInstance().clear();
  });

  afterAll(async () => {
    await TestFactory.cleanup();
  });

  it('1. Registration Init', async () => {
    const res = await request(app).post('/api/v1/auth/register/init')
      .send({ name: 'E2E Cust', email: customerEmail, password: customerPassword });
    expect(res.status).toBe(200);
  });

  it('2. OTP Verification', async () => {
    const emailData = MockEmailProvider.getInstance().sentEmails.find(e => e.to === customerEmail);
    expect(emailData).toBeDefined();
    const otp = emailData!.text.match(/\b\d{6}\b/)![0];

    const res = await request(app).post('/api/v1/auth/register/verify')
      .send({ email: customerEmail, otp });
    
    expect(res.status).toBe(201);
    customerId = res.body.data.user.id;
    TestFactory.createdUserIds.push(customerId);
  });

  it('3. Login', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: customerEmail, password: customerPassword });
    
    expect(res.status).toBe(200);
    customerToken = res.body.data.token;
  });

  it('4. Quote', async () => {
    const res = await request(app).post('/api/v1/orders/quote')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        pickupAddress: 'Delhi', dropAddress: 'Haryana',
        length: 10, breadth: 10, height: 10, actualWeight: 5,
        orderType: 'B2C', paymentType: 'COD'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.calculatedCharge).toBe(325); // 5 * 60 (intra B2C) = 300 + 25 COD = 325
  });

  it('5. Create B2C COD Order', async () => {
    const res = await request(app).post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', `e2e-order-${Date.now()}`)
      .send({
        pickupAddress: 'Delhi', dropAddress: 'Haryana',
        pickupLat: 28.61, pickupLng: 77.21, dropLat: 29.0, dropLng: 76.0,
        pickupPincode: '110001', dropPincode: '120001',
        length: 10, breadth: 10, height: 10, actualWeight: 5,
        orderType: 'B2C', paymentType: 'COD'
      });
    
    expect(res.status).toBe(201);
    orderId = res.body.data.id;
    TestFactory.createdOrderIds.push(orderId);
  });

  it('6. PostGIS Assignment', async () => {
    // Background worker assigns the order. Wait a tiny bit (the API actually synchronously calls AssignmentService in creation for now)
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe('ASSIGNED');
    
    const attempt = await prisma.deliveryAttempt.findFirst({ where: { orderId } });
    expect(attempt?.agentId).toBe(agentProfileId);
  });

  it('7. Agent Accept', async () => {
    // Actually, in our current flow, ASSIGNED is when agent is attached. 
    // Agent status transitions usually start from PICKED_UP or we need an ACCEPT API? 
    // Currently, our system just goes ASSIGNED -> PICKED_UP.
    const res = await request(app).patch(`/api/v1/agent/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'PICKED_UP' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PICKED_UP');
  });

  it('8. Lifecycle Transitions', async () => {
    let res = await request(app).patch(`/api/v1/agent/orders/${orderId}/status`).set('Authorization', `Bearer ${agentToken}`).send({ status: 'IN_TRANSIT' });
    expect(res.status).toBe(200);
    
    res = await request(app).patch(`/api/v1/agent/orders/${orderId}/status`).set('Authorization', `Bearer ${agentToken}`).send({ status: 'OUT_FOR_DELIVERY' });
    expect(res.status).toBe(200);
    
    res = await request(app).patch(`/api/v1/agent/orders/${orderId}/status`).set('Authorization', `Bearer ${agentToken}`).send({ status: 'DELIVERED' });
    expect(res.status).toBe(200);
  });

  it('9. Customer Feedback', async () => {
    const res = await request(app).post(`/api/v1/orders/${orderId}/feedback`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 5, comments: 'Excellent!' });
    
    expect(res.status).toBe(201);
  });

  it('10. Agent Performance', async () => {
    // Wait for performance to calculate if it was async, or just query it
    const perf = await prisma.agentPerformance.findUnique({ where: { agentId: agentProfileId } });
    expect(perf).toBeDefined();
    expect(perf?.deliveriesCompleted).toBe(1);
    expect(perf?.averageRating).toBe(5);
  });
});
