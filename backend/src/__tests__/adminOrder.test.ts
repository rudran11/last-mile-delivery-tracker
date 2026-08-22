import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

let adminToken = '';
let customerToken = '';
let customerId = '';
let zoneId = '';

beforeAll(async () => {
  const hash = await bcrypt.hash('password123', 10);

  const adminEmail = `admin_ord_${Date.now()}@test.com`;
  const customerEmail = `cust_ord_${Date.now()}@test.com`;
  const agentEmail = `agent_ord_${Date.now()}@test.com`;

  await prisma.user.create({ data: { email: adminEmail, passwordHash: hash, role: Role.ADMIN } });
  const c = await prisma.user.create({ data: { email: customerEmail, passwordHash: hash, role: Role.CUSTOMER } });
  const a = await prisma.user.create({ data: { email: agentEmail, passwordHash: hash, role: Role.AGENT } });

  const z = await prisma.zone.create({ data: { name: `Admin Test Zone ${Date.now()}` } });
  zoneId = z.id;
  
  const ap = await prisma.agentProfile.create({ data: { userId: a.id, isAvailable: true, currentZoneId: z.id } });
  await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(77.2167, 28.6328), 4326) WHERE id = ${ap.id}`;

  await prisma.rateConfiguration.create({
    data: { b2bIntraZoneRate: 50, b2bInterZoneRate: 70, b2cIntraZoneRate: 60, b2cInterZoneRate: 80, b2cCodSurcharge: 25, b2bCodSurcharge: 25, isActive: true }
  });
  
  // Login Admin
  const adminRes = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'password123' });
  adminToken = adminRes.body.data.token;

  // Login Customer
  const custRes = await request(app).post('/api/v1/auth/login').send({ email: customerEmail, password: 'password123' });
  customerToken = custRes.body.data.token;
  customerId = custRes.body.data.user.id;
});

describe('Admin Order Creation (Sprint 1-6 E2E Verification)', () => {
  let createdOrderId = '';

  it('should reject CUSTOMER calling Admin order creation endpoint', async () => {
    const res = await request(app)
      .post('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customerId,
        pickupAddress: 'Admin Pickup St',
        pickupLat: 28.7041, pickupLng: 77.1025, pickupPincode: '110001',
        dropAddress: 'Admin Drop St',
        dropLat: 19.0760, dropLng: 72.8777, dropPincode: '400001',
        length: 10, breadth: 10, height: 10, actualWeight: 5,
        orderType: 'B2C', paymentType: 'PREPAID'
      });
    
    expect(res.status).toBe(403);
  });

  it('should allow ADMIN to create order on behalf of CUSTOMER', async () => {
    const res = await request(app)
      .post('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', `admin-order-${Date.now()}`)
      .send({
        customerId,
        pickupAddress: 'Admin Pickup St',
        pickupLat: 28.7041, pickupLng: 77.1025, pickupPincode: '110001',
        dropAddress: 'Admin Drop St',
        dropLat: 19.0760, dropLng: 72.8777, dropPincode: '400001',
        length: 10, breadth: 10, height: 10, actualWeight: 5,
        orderType: 'B2C', paymentType: 'PREPAID'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdOrderId = res.body.data.id;

    // Verify ownership
    expect(res.body.data.customerId).toBe(customerId);
  });

  it('should have created a valid Pricing Snapshot', async () => {
    const snapshot = await prisma.pricingSnapshot.findUnique({
      where: { orderId: createdOrderId }
    });
    
    expect(snapshot).toBeDefined();
    expect(snapshot?.actualWeight.toNumber()).toBe(5);
  });

  it('should resolve valid Coordinates in PostGIS', async () => {
    // Checking ST_X and ST_Y directly using Raw Query since Prisma doesn't pull raw geometry natively
    const point = await prisma.$queryRaw<Array<{ lng: number, lat: number }>>`
      SELECT ST_X("pickupLocation"::geometry) as lng, ST_Y("pickupLocation"::geometry) as lat
      FROM "Order" WHERE id = ${createdOrderId}
    `;
    
    expect(point[0]?.lng).toBeCloseTo(77.1025, 4);
    expect(point[0]?.lat).toBeCloseTo(28.7041, 4);
  });

  it('should resolve correct Zone references', async () => {
    const order = await prisma.order.findUnique({ where: { id: createdOrderId }, include: { pickupZone: true } });
    expect(order?.pickupZoneId).toBeDefined();
  });

  it('should have automatically assigned nearest agent', async () => {
    // Wait a little bit for the background auto-assignment promise to resolve
    await new Promise(r => setTimeout(r, 1000));
    
    const order = await prisma.order.findUnique({ where: { id: createdOrderId } });
    // Agent was in Delhi, Order was in Delhi, should be ASSIGNED
    expect(order?.status).toBe('ASSIGNED');
  });

  it('should allow the CUSTOMER to subsequently see the order', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdOrderId);
    expect(res.body.data.customerId).toBe(customerId);
  });
});
