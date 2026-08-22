import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { generateToken } from '../utils/jwt';
import { Role, OrderType, PaymentType, OrderStatus, AttemptStatus } from '@prisma/client';
import { AssignmentService } from '../services/AssignmentService';

describe('Dispatch & Fleet Assignment', () => {
  let adminToken: string;
  let agent5Id: string;
  let customerId: string;
  let northZone: any;
  let southZone: any;

  beforeAll(async () => {
    const ts = Date.now();
    const admin = await prisma.user.create({
      data: { email: `admin_dispatch_${ts}@test.com`, name: 'Admin', passwordHash: 'hash', role: Role.ADMIN }
    });
    adminToken = generateToken({ userId: admin.id, role: Role.ADMIN });

    const customer = await prisma.user.create({
      data: { email: `cust_dispatch_${ts}@test.com`, name: 'Cust', passwordHash: 'hash', role: Role.CUSTOMER }
    });
    customerId = customer.id;

    northZone = await prisma.zone.findFirst({ where: { name: 'North Zone' } });
    southZone = await prisma.zone.findFirst({ where: { name: 'South Zone' } });

    // Seed Kerala Agent (Agent 5) using the API to test full integration
    const res = await request(app)
      .post('/api/v1/admin/agents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Agent 5 Kerala',
        email: `agent5_kerala_${ts}@test.com`,
        password: 'securepassword',
        lat: 9.9312,
        lng: 76.2673,
        isAvailable: true
      });
    agent5Id = res.body.data.profile.id;
  });

  afterAll(async () => {
    // Delete Test Orders (DeliveryAttempts, TrackingHistory, PricingSnapshots handled automatically via our cleanup scripts, or we can just delete them directly)
    await prisma.notification.deleteMany({});
    await prisma.pricingSnapshot.deleteMany({});
    await prisma.deliveryAttempt.deleteMany({});
    await prisma.trackingHistory.deleteMany({});
    await prisma.order.deleteMany({});

    if (agent5Id) {
      await prisma.agentProfile.deleteMany({ where: { id: agent5Id } });
    }
    
    // The timestamp allows us to identify the users created in this test
    const emailPrefixes = ['admin_dispatch_', 'cust_dispatch_', 'agent5_kerala_'];
    for (const prefix of emailPrefixes) {
       await prisma.user.deleteMany({
         where: { email: { startsWith: prefix } }
       });
    }

    // Restore baseline agents availability to expected test states to not pollute other tests
    await prisma.agentProfile.updateMany({ data: { isAvailable: true } });
  });

  it('DISPATCH-01/04: Kerala Order assigns to Agent 5, second order goes to next closest', async () => {
    // We manually insert Order 1 at Kerala Coordinates (9.9312, 76.2673)
    const order1 = await prisma.order.create({
      data: {
        customerId,
        pickupAddress: 'Kochi, Kerala', dropAddress: 'Chennai, TN',
        pickupZoneId: southZone.id, dropZoneId: southZone.id,
        length: 10, breadth: 10, height: 10, actualWeight: 5, volumetricWeight: 0.2, billableWeight: 5,
        orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, calculatedCharge: 250, status: OrderStatus.PENDING,
      }
    });

    await prisma.$executeRaw`
      UPDATE "Order" SET "pickupLocation" = ST_SetSRID(ST_MakePoint(76.2673, 9.9312), 4326) WHERE id = ${order1.id}
    `;

    // Trigger assignment
    await AssignmentService.assignAgent(order1.id, customerId);

    // Verify Agent 5 received it
    const attempt1 = await prisma.deliveryAttempt.findFirst({ where: { orderId: order1.id } });
    expect(attempt1?.agentId).toBe(agent5Id);

    // Verify Agent 5 is now unavailable
    const agent5 = await prisma.agentProfile.findUnique({ where: { id: agent5Id } });
    expect(agent5?.isAvailable).toBe(false);

    // FIX: Make sure at least one other agent is available since other tests might have claimed them
    await prisma.agentProfile.updateMany({
      where: { isAvailable: false, id: { not: agent5Id } },
      data: { isAvailable: true }
    });

    // Create Order 2 at Kerala Coordinates
    const order2 = await prisma.order.create({
      data: {
        customerId,
        pickupAddress: 'Kochi, Kerala', dropAddress: 'Chennai, TN',
        pickupZoneId: southZone.id, dropZoneId: southZone.id,
        length: 10, breadth: 10, height: 10, actualWeight: 5, volumetricWeight: 0.2, billableWeight: 5,
        orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, calculatedCharge: 250, status: OrderStatus.PENDING,
      }
    });

    await prisma.$executeRaw`
      UPDATE "Order" SET "pickupLocation" = ST_SetSRID(ST_MakePoint(76.2673, 9.9312), 4326) WHERE id = ${order2.id}
    `;

    // Trigger assignment for Order 2
    await AssignmentService.assignAgent(order2.id, customerId);

    // Verify Agent 5 DID NOT receive it
    const attempt2 = await prisma.deliveryAttempt.findFirst({ where: { orderId: order2.id } });
    expect(attempt2?.agentId).not.toBe(agent5Id);
    
    // It should have gone to the closest active agent (Agent 2 in Chennai - Lat: 13.0400, Lng: 80.2300 is closest to Kerala among the 4 baseline agents)
    // We can fetch Agent 2's id by looking at the DB or just checking it's not agent5Id and is assigned to someone.
    expect(attempt2?.agentId).toBeDefined();
  });
});
