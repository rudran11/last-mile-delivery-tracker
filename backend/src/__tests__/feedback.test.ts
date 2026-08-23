import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { TestFactory } from './factories/TestFactory';
import { generateToken } from '../utils/jwt';

jest.mock('../services/NotificationService', () => ({
  NotificationService: { emit: async () => true }
}));
jest.mock('../services/AssignmentService', () => ({
  AssignmentService: {
    assignAgent: async () => { assignmentDetails: {} },
    manualReassign: async () => {}
  }
}));

describe('Customer Feedback API', () => {
  let customerToken: string;
  let customerId: string;
  let orderId: string;
  let agentId: string;
  let agentToken: string;

  beforeAll(async () => {
    const customer = await TestFactory.createUser('CUSTOMER', 'feedback_cust');
    customerId = customer.id;
    customerToken = generateToken({ userId: customerId, role: 'CUSTOMER' });

    const zone = await TestFactory.createZone('Feedback Zone');
    const agent = await TestFactory.createAgent(10, 10, zone.id);
    agentId = agent.user.id;
    agentToken = generateToken({ userId: agentId, role: 'AGENT' });

    const order = await prisma.order.create({
      data: {
        customerId,
        pickupAddress: 'Test', dropAddress: 'Test',
        pickupZoneId: zone.id, dropZoneId: zone.id,
        length: 10, breadth: 10, height: 10, actualWeight: 5, volumetricWeight: 1, billableWeight: 5,
        orderType: 'B2C', paymentType: 'PREPAID', calculatedCharge: 100,
        status: 'DELIVERED',
        deliveryAttempts: {
          create: {
            agentId: agent.profile.id,
            attemptNumber: 1,
            status: 'SUCCESS',
            scheduledDate: new Date()
          }
        }
      }
    });
    orderId = order.id;
    TestFactory.createdOrderIds.push(orderId);
  });

  afterAll(async () => {
    await prisma.customerFeedback.deleteMany({ where: { orderId } });
    await TestFactory.cleanup();
  });

  it('FDBK-01: Customer can submit feedback on delivered order', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/feedback`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 5, comments: 'Great delivery!' });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(5);
  });

  it('FDBK-02: Duplicate feedback rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/feedback`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 4, comments: 'Changed my mind' });
    
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('already submitted');
  });

  it('FDBK-03: Invalid rating (<1 or >5) rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/feedback`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 6, comments: 'Impossible rating' });
    
    expect(res.status).toBe(400);
  });

  it('FDBK-04: Agent cannot spoof feedback on their own delivery', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/feedback`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ rating: 5, comments: 'Self praise' });
    
    expect(res.status).toBe(403);
  });

  it('FDBK-05: Customer cannot rate PENDING order', async () => {
    const pendingOrder = await prisma.order.create({
      data: {
        customerId,
        pickupAddress: 'Test', dropAddress: 'Test',
        length: 10, breadth: 10, height: 10, actualWeight: 5, volumetricWeight: 1, billableWeight: 5,
        orderType: 'B2C', paymentType: 'PREPAID',
        calculatedCharge: 100,
        status: 'PENDING'
      }
    });
    TestFactory.createdOrderIds.push(pendingOrder.id);

    const res = await request(app)
      .post(`/api/v1/orders/${pendingOrder.id}/feedback`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 5, comments: 'Fast!' });
    
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('delivered');
  });
});
