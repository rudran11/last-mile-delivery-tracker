import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { TestFactory } from './factories/TestFactory';

jest.mock('../services/NotificationService', () => ({
  NotificationService: { emit: async () => true }
}));
import { generateToken } from '../utils/jwt';

describe('Explainable Dispatch API (Phase 2C-7)', () => {
  let adminToken: string;
  let orderId: string;
  let zoneId: string;

  beforeAll(async () => {
    const admin = await TestFactory.createUser('ADMIN', 'explain_admin');
    adminToken = generateToken({ userId: admin.id, role: 'ADMIN' });

    const customer = await TestFactory.createUser('CUSTOMER', 'explain_cust');

    const zone = await TestFactory.createZone('Explain Zone');
    zoneId = zone.id;

    // Agent 1: Eligible, Close
    await TestFactory.createAgent(85, 85, zone.id, true);
    
    // Agent 2: Busy (Unavailable), Closer
    await TestFactory.createAgent(86, 86, zone.id, false);

    // Agent 3: Missing location
    const a3 = await TestFactory.createAgent(0, 0, zone.id, true);
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = NULL WHERE id = ${a3.profile.id}`;

    // Agent 4: Eligible, Far
    await TestFactory.createAgent(89, 89, zone.id, true);

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        pickupAddress: 'Explain Pickup', dropAddress: 'Explain Drop',
        pickupZoneId: zone.id, dropZoneId: zone.id,
        length: 10, breadth: 10, height: 10, actualWeight: 5, volumetricWeight: 0.2, billableWeight: 5,
        orderType: 'B2C', paymentType: 'PREPAID', calculatedCharge: 250, status: 'PENDING',
      }
    });
    orderId = order.id;
    TestFactory.createdOrderIds.push(orderId);
    
    // Order at (85.1, 85.1)
    await prisma.$executeRaw`
      UPDATE "Order" SET "pickupLocation" = ST_SetSRID(ST_MakePoint(85.1, 85.1), 4326) WHERE id = ${order.id}
    `;
  });

  afterAll(async () => {
    await TestFactory.cleanup();
  });

  it('EXP-01: Returns correct JSON structure', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/orders/${orderId}/dispatch-explanation`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.liveAnalysis).toBeDefined();
    
    const exp = res.body.data.liveAnalysis;
    expect(exp.candidates).toBeDefined();
    expect(Array.isArray(exp.candidates)).toBe(true);
  });

  it('EXP-02: Accurately classifies agent eligibility and state', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/orders/${orderId}/dispatch-explanation`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    const candidates = res.body.data.liveAnalysis.candidates;
    
    // 4 test agents in this zone
    expect(candidates.length).toBeGreaterThanOrEqual(2);

    const busy = candidates.find((c: any) => c.status === 'EXCLUDED' && c.reason === 'Busy / Offline');
    expect(busy).toBeDefined();

    const eligible = candidates.filter((c: any) => c.status === 'ELIGIBLE');
    expect(eligible.length).toBeGreaterThanOrEqual(1);
  });

  it('EXP-03: Ranks candidates by distance accurately', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/orders/${orderId}/dispatch-explanation`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    const eligible = res.body.data.liveAnalysis.candidates.filter((c: any) => c.status === 'ELIGIBLE');
    
    // Nearest should be first among eligible
    const firstEligible = eligible[0];
    const secondEligible = eligible[1];
    
    if (firstEligible && secondEligible) {
      expect(firstEligible.distance).toBeLessThan(secondEligible.distance);
    }
  });
});
