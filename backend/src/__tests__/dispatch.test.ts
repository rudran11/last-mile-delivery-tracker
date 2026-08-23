import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { generateToken } from '../utils/jwt';
import { TestFactory } from './factories/TestFactory';

jest.mock('../services/NotificationService', () => ({
  NotificationService: { emit: async () => true }
}));
import { AssignmentService } from '../services/AssignmentService';

describe('Dispatch & Fleet Assignment (Phase 2C-4)', () => {
  let customerId: string;
  let zone1: string;
  let zone2: string;

  beforeAll(async () => {
    const customer = await TestFactory.createUser('CUSTOMER', 'dispatch_cust');
    customerId = customer.id;

    const z1 = await TestFactory.createZone('Dispatch Zone 1');
    const z2 = await TestFactory.createZone('Dispatch Zone 2');
    zone1 = z1.id;
    zone2 = z2.id;
  });

  afterAll(async () => {
    await TestFactory.cleanup();
  });

  const createTestOrder = async (lat: number, lng: number, zoneId: string) => {
    const order = await prisma.order.create({
      data: {
        customerId,
        pickupAddress: 'Test Pickup', dropAddress: 'Test Drop',
        pickupZoneId: zoneId, dropZoneId: zoneId,
        length: 10, breadth: 10, height: 10, actualWeight: 5, volumetricWeight: 0.2, billableWeight: 5,
        orderType: 'B2C', paymentType: 'PREPAID', calculatedCharge: 250, status: 'PENDING',
      }
    });
    TestFactory.createdOrderIds.push(order.id);
    await prisma.$executeRaw`
      UPDATE "Order" SET "pickupLocation" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326) WHERE id = ${order.id}
    `;
    return order.id;
  };

  it('Nearest agent is selected regardless of Zone (Zone does not override physical distance)', async () => {
    // Agent 1: Zone 1, Distance: Far (10, 10)
    const agent1 = await TestFactory.createAgent(10, 10, zone1, true);
    // Agent 2: Zone 2, Distance: Close (20, 20)
    const agent2 = await TestFactory.createAgent(20, 20, zone2, true);

    // Order placed in Zone 1, but closest to (20, 20) which is where Agent 2 is.
    const orderId = await createTestOrder(20.1, 20.1, zone1);

    await AssignmentService.assignAgent(orderId, customerId);

    const attempt = await prisma.deliveryAttempt.findFirst({ where: { orderId } });
    
    // Agent 2 should be selected despite being in Zone 2, because they are physically closer.
    expect(attempt?.agentId).toBe(agent2.profile.id);
  });

  it('Unavailable or inactive agents are ignored', async () => {
    // Agent 3: Close, but unavailable
    const agent3 = await TestFactory.createAgent(30, 30, zone1, false);
    // Agent 4: Far, but available
    const agent4 = await TestFactory.createAgent(40, 40, zone1, true);

    const orderId = await createTestOrder(30.1, 30.1, zone1);
    await AssignmentService.assignAgent(orderId, customerId);

    const attempt = await prisma.deliveryAttempt.findFirst({ where: { orderId } });
    
    // Agent 4 selected because Agent 3 is unavailable
    expect(attempt?.agentId).toBe(agent4.profile.id);
  });

  it('Agents missing coordinates are ignored', async () => {
    // Agent 5: Missing coordinates (we create, then nullify coordinates)
    // We use (-60, -60) region to completely isolate from earlier tests (which used 10-40)
    const agent5 = await TestFactory.createAgent(-60, -60, zone1, true);
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = NULL WHERE id = ${agent5.profile.id}`;

    // Agent 6: Far from the center but has coordinates, should be chosen
    const agent6 = await TestFactory.createAgent(-61, -61, zone1, true);

    const orderId = await createTestOrder(-60.1, -60.1, zone1);
    await AssignmentService.assignAgent(orderId, customerId);

    const attempt = await prisma.deliveryAttempt.findFirst({ where: { orderId } });
    
    // Agent 6 selected because Agent 5 has no coordinates, and all other agents (from other tests) are thousands of km away
    expect(attempt?.agentId).toBe(agent6.profile.id);
  });

  it('Concurrency: Closest agent becomes unavailable, next order goes to next closest', async () => {
    // Agent 7: Kerala mock (-80, -80)
    const agent7 = await TestFactory.createAgent(-80, -80, zone1, true);
    // Agent 8: Chennai mock (-81, -81)
    const agent8 = await TestFactory.createAgent(-81, -81, zone1, true);

    // Order 1 at Kerala mock (-80.1, -80.1)
    const order1 = await createTestOrder(-80.1, -80.1, zone1);
    await AssignmentService.assignAgent(order1, customerId);

    // Agent 7 gets Order 1 (closest)
    const attempt1 = await prisma.deliveryAttempt.findFirst({ where: { orderId: order1 } });
    expect(attempt1?.agentId).toBe(agent7.profile.id);

    // Order 2 at Kerala mock (-80.1, -80.1)
    const order2 = await createTestOrder(-80.1, -80.1, zone1);
    await AssignmentService.assignAgent(order2, customerId);

    // Agent 8 gets Order 2 because Agent 7 is busy
    const attempt2 = await prisma.deliveryAttempt.findFirst({ where: { orderId: order2 } });
    expect(attempt2?.agentId).toBe(agent8.profile.id);
  });
});
