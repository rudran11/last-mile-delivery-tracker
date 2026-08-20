import { PrismaClient, Role, OrderType, PaymentType, ZoneRelationshipType, OrderStatus, AttemptStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function runTests() {
  console.log('--- RUNNING DATABASE AUTOMATED TESTS ---')
  
  let passed = 0;
  let failed = 0;

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    try {
      await testFn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(e.message || e);
      failed++;
    }
  }

  // 1. Constraints: Invalid foreign key fails
  await runTest('Invalid Foreign Key Fails (User -> Order)', async () => {
    try {
      await prisma.order.create({
        data: {
          customerId: 'invalid-id-that-does-not-exist',
          pickupAddress: 'A', dropAddress: 'B', pickupZoneId: 'invalid-zone-id', dropZoneId: 'invalid-zone-id',
          length: 10, breadth: 10, height: 10, actualWeight: 10, volumetricWeight: 10, billableWeight: 10,
          orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, calculatedCharge: 100
        }
      });
      throw new Error('Allowed creation of order with invalid foreign keys');
    } catch (e: any) {
      if (e.message.includes('Allowed creation')) throw e;
    }
  });

  // 2. CHECK Constraints: Negative Weight Rejected
  await runTest('CHECK Constraint: Negative Weight Rejected', async () => {
    const user = await prisma.user.create({ data: { email: `negweight_${Date.now()}@test.com`, passwordHash: 'h', role: Role.CUSTOMER } });
    const zone = await prisma.zone.create({ data: { name: `Z_${Date.now()}` } });
    try {
      await prisma.order.create({
        data: {
          customerId: user.id, pickupAddress: 'A', dropAddress: 'B', pickupZoneId: zone.id, dropZoneId: zone.id,
          length: 10, breadth: 10, height: 10, actualWeight: -5, volumetricWeight: 10, billableWeight: -5,
          orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, calculatedCharge: 100
        }
      });
      throw new Error('Allowed creation of order with negative weight');
    } catch (e: any) {
      if (e.message.includes('Allowed creation')) throw e;
    }
  });

  // 3. Immutability Triggers: TrackingHistory UPDATE fails
  await runTest('Immutability Trigger: TrackingHistory UPDATE fails', async () => {
    const user = await prisma.user.create({ data: { email: `track_upd_${Date.now()}@test.com`, passwordHash: 'h', role: Role.AGENT } });
    const zone = await prisma.zone.create({ data: { name: `Z2_${Date.now()}` } });
    const order = await prisma.order.create({
      data: {
        customerId: user.id, pickupAddress: 'A', dropAddress: 'B', pickupZoneId: zone.id, dropZoneId: zone.id,
        length: 10, breadth: 10, height: 10, actualWeight: 10, volumetricWeight: 10, billableWeight: 10,
        orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, calculatedCharge: 100
      }
    });
    
    const history = await prisma.trackingHistory.create({
      data: { orderId: order.id, status: OrderStatus.PENDING, actorId: user.id }
    });

    try {
      await prisma.trackingHistory.update({
        where: { id: history.id },
        data: { status: OrderStatus.DELIVERED }
      });
      throw new Error('TrackingHistory allowed UPDATE');
    } catch(e: any) {
      if (e.message.includes('TrackingHistory allowed UPDATE')) throw e;
    }
  });

  // 4. Pricing Snapshot Immutability
  await runTest('Immutability Trigger: PricingSnapshot UPDATE fails', async () => {
    const user = await prisma.user.create({ data: { email: `price_upd_${Date.now()}@test.com`, passwordHash: 'h', role: Role.CUSTOMER } });
    const zone = await prisma.zone.create({ data: { name: `Z3_${Date.now()}` } });
    const rateConfig = await prisma.rateConfiguration.create({
      data: { b2bIntraZoneRate: 50, b2bInterZoneRate: 70, b2cIntraZoneRate: 60, b2cInterZoneRate: 80, codSurcharge: 25, isActive: true }
    });
    const order = await prisma.order.create({
      data: {
        customerId: user.id, pickupAddress: 'A', dropAddress: 'B', pickupZoneId: zone.id, dropZoneId: zone.id,
        length: 10, breadth: 10, height: 10, actualWeight: 10, volumetricWeight: 10, billableWeight: 10,
        orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, calculatedCharge: 100
      }
    });

    const snapshot = await prisma.pricingSnapshot.create({
      data: {
        orderId: order.id, rateConfigurationId: rateConfig.id,
        actualWeight: 10, volumetricWeight: 10, billableWeight: 10,
        orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, zoneRelationship: ZoneRelationshipType.INTRA_ZONE,
        appliedRate: 50, appliedCodSurcharge: 0, baseCharge: 500, finalCharge: 500
      }
    });

    try {
      await prisma.pricingSnapshot.update({
        where: { id: snapshot.id },
        data: { finalCharge: 9999 }
      });
      throw new Error('PricingSnapshot allowed UPDATE');
    } catch(e: any) {
      if (e.message.includes('PricingSnapshot allowed UPDATE')) throw e;
    }
  });

  // 5. PostGIS Nearest Agent Query
  await runTest('PostGIS Nearest Agent Query & EXPLAIN ANALYZE', async () => {
    try {
      // Find nearest agent to a fixed point (e.g. -74.0050, 40.7120)
      const res: any = await prisma.$queryRaw`
        EXPLAIN ANALYZE
        SELECT "userId", 
               ST_Distance("currentLocation", ST_SetSRID(ST_MakePoint(-74.0050, 40.7120), 4326)) as distance
        FROM "AgentProfile"
        WHERE "isAvailable" = true
        ORDER BY "currentLocation" <-> ST_SetSRID(ST_MakePoint(-74.0050, 40.7120), 4326)
        LIMIT 1;
      `;
      
      const plan = res.map((r: any) => r['QUERY PLAN']).join('\n');
      console.log('EXPLAIN ANALYZE Plan:');
      console.log(plan);
      
      if (!plan.includes('Index') && !plan.includes('Scan')) {
        throw new Error('Unexpected EXPLAIN ANALYZE output');
      }
    } catch (e: any) {
      throw new Error(`PostGIS query failed: ${e.message}`);
    }
  });

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
}

runTests()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
