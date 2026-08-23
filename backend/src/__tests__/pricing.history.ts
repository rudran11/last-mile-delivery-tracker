import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { TestFactory } from './factories/TestFactory';

jest.mock('../services/NotificationService', () => ({
  NotificationService: { emit: async () => true }
}));
jest.mock('../services/AssignmentService', () => ({
  AssignmentService: {
    assignAgent: async () => { assignmentDetails: {} },
    manualReassign: async () => {}
  }
}));
import { generateToken } from '../utils/jwt';

describe('Pricing & COD Logic', () => {
  let customerToken: string;
  let customerId: string;
  let zoneA: string;
  let zoneB: string;

  beforeAll(async () => {
    // We need exact state matches from OrderService for address resolution
    const zA = await TestFactory.createZone('North Zone'); // Delhi maps to North Zone
    const zB = await TestFactory.createZone('West Zone');  // Maharashtra maps to West Zone
    zoneA = zA.id;
    zoneB = zB.id;

    await TestFactory.createRateConfiguration({
      b2bIntraZoneRate: 50,
      b2bInterZoneRate: 70,
      b2cIntraZoneRate: 60,
      b2cInterZoneRate: 80,
      b2cCodSurcharge: 25,
      b2bCodSurcharge: 25,
      isActive: true
    });

    const customer = await TestFactory.createUser('CUSTOMER', 'pricing_cust');
    customerId = customer.id;
    customerToken = generateToken({ userId: customerId, role: 'CUSTOMER' });
  });

  afterAll(async () => {
    await TestFactory.cleanup();
  });

  const createOrder = async (orderType: string, paymentType: string, pickupAddress: string, dropAddress: string, dropLat: number, dropLng: number) => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', `pricing-${orderType}-${paymentType}-${Date.now()}`)
      .send({
        pickupAddress, pickupLat: 28.7, pickupLng: 77.1, pickupPincode: '110001',
        dropAddress, dropLat, dropLng, dropPincode: '400001',
        length: 10, breadth: 10, height: 10, actualWeight: 5,
        orderType, paymentType
      });
    
    if (res.body.success) {
      TestFactory.createdOrderIds.push(res.body.data.id);
    }
    return res;
  };

  it('B2C PREPAID Intra-Zone', async () => {
    // Delhi to Haryana (Both North Zone, pass coordinates for Haryana/Delhi region)
    // 28.7, 77.1 is Delhi. We pass 28.6, 77.2 (also Delhi) to ensure it resolves to North Zone
    const res = await createOrder('B2C', 'PREPAID', '123 St, Delhi', '456 St, Delhi', 28.6, 77.2);
    expect(res.status).toBe(201);
    
    // Weight = 5kg. Billable = 5. Intra-zone B2C = 60. Base = 5 * 60 = 300.
    // Prepaid = No COD surcharge. Total = 300.
    expect(Number(res.body.data.calculatedCharge)).toBe(300);
    
    const snap = await prisma.pricingSnapshot.findUnique({ where: { orderId: res.body.data.id } });
    expect(snap?.baseCharge.toNumber()).toBe(300);
    expect(snap?.appliedCodSurcharge.toNumber()).toBe(0);
  });

  it('B2C COD Inter-Zone', async () => {
    // Delhi (North) to Maharashtra (West). Mumbai is 19.0, 72.8
    const res = await createOrder('B2C', 'COD', '123 St, Delhi', '456 St, Maharashtra', 19.0, 72.8);
    expect(res.status).toBe(201);
    
    // Weight = 5kg. Inter-zone B2C = 80. Base = 5 * 80 = 400.
    // COD = 25 surcharge. Total = 425.
    expect(Number(res.body.data.calculatedCharge)).toBe(425);
    
    const snap = await prisma.pricingSnapshot.findUnique({ where: { orderId: res.body.data.id } });
    expect(snap?.baseCharge.toNumber()).toBe(400);
    expect(snap?.appliedCodSurcharge.toNumber()).toBe(25);
  });

  it('B2B PREPAID Inter-Zone', async () => {
    const res = await createOrder('B2B', 'PREPAID', '123 St, Delhi', '456 St, Maharashtra', 19.0, 72.8);
    expect(res.status).toBe(201);
    
    // Weight = 5kg. Inter-zone B2B = 70. Base = 5 * 70 = 350.
    // Prepaid = No COD surcharge. Total = 350.
    expect(Number(res.body.data.calculatedCharge)).toBe(350);
  });

  it('B2B COD Intra-Zone', async () => {
    const res = await createOrder('B2B', 'COD', '123 St, Delhi', '456 St, Haryana', 28.6, 77.2);
    expect(res.status).toBe(201);
    
    // Weight = 5kg. Intra-zone B2B = 50. Base = 5 * 50 = 250.
    // COD = 25. Total = 275.
    expect(Number(res.body.data.calculatedCharge)).toBe(275);
  });
});
