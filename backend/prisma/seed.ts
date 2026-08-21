import { PrismaClient, Role, OrderType, PaymentType, OrderStatus, AttemptStatus, ZoneRelationshipType } from '@prisma/client'
import bcrypt from 'bcrypt';

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);
  const agentHash = await bcrypt.hash('agent123', 10);

  // 1. Users
  const admin = await prisma.user.create({ data: { email: 'admin@unthinkable.co', passwordHash: adminHash, role: Role.ADMIN } })
  const customer1 = await prisma.user.create({ data: { email: 'customer@unthinkable.co', passwordHash: customerHash, role: Role.CUSTOMER } })
  const customer2 = await prisma.user.create({ data: { email: 'customer2@test.com', passwordHash: customerHash, role: Role.CUSTOMER } })

  // Agents
  const agent1 = await prisma.user.create({ data: { email: 'agent1@unthinkable.co', passwordHash: agentHash, role: Role.AGENT } })
  const agent2 = await prisma.user.create({ data: { email: 'agent2@test.com', passwordHash: agentHash, role: Role.AGENT } })
  const agent3 = await prisma.user.create({ data: { email: 'agent3@test.com', passwordHash: agentHash, role: Role.AGENT } })

  // 2. Zones & Areas
  const northZone = await prisma.zone.create({ data: { name: 'North Zone' } })
  const southZone = await prisma.zone.create({ data: { name: 'South Zone' } })
  await prisma.area.createMany({
    data: [
      { name: 'North Area 1', pincode: '100001', zoneId: northZone.id },
      { name: 'South Area 1', pincode: '200001', zoneId: southZone.id },
    ]
  })
  await prisma.zoneAdjacency.createMany({
    data: [
      { zoneId: northZone.id, adjacentZoneId: southZone.id, priority: 1 },
      { zoneId: southZone.id, adjacentZoneId: northZone.id, priority: 1 },
    ]
  })

  // Agent Profiles
  const agentProfile1 = await prisma.agentProfile.create({ data: { userId: agent1.id, isAvailable: true, currentZoneId: northZone.id } })
  const agentProfile2 = await prisma.agentProfile.create({ data: { userId: agent2.id, isAvailable: true, currentZoneId: southZone.id } })
  const agentProfile3 = await prisma.agentProfile.create({ data: { userId: agent3.id, isAvailable: false, currentZoneId: northZone.id } })

  // UPDATE AGENT COORDINATES via Raw SQL
  try {
    // Agent 1 is in North Zone (say, lat: 40.7128, lon: -74.0060)
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326) WHERE id = ${agentProfile1.id}`
    // Agent 2 is in South Zone (say, lat: 40.7000, lon: -74.0100)
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(-74.0100, 40.7000), 4326) WHERE id = ${agentProfile2.id}`
    // Agent 3 is in North Zone but unavailable (lat: 40.7130, lon: -74.0065)
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(-74.0065, 40.7130), 4326) WHERE id = ${agentProfile3.id}`
  } catch(e) {
    throw new Error("PostGIS is required for this project. Ensure the database is running with the PostGIS extension enabled.");
  }

  // 3. Rate Configuration
  const rateConfig = await prisma.rateConfiguration.create({
    data: { b2bIntraZoneRate: 50, b2bInterZoneRate: 70, b2cIntraZoneRate: 60, b2cInterZoneRate: 80, codSurcharge: 25, isActive: true }
  })

  // 4. Orders
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id, pickupAddress: 'Pickup 1', dropAddress: 'Drop 1',
      pickupZoneId: northZone.id, dropZoneId: northZone.id,
      length: 10, breadth: 10, height: 10, actualWeight: 5, volumetricWeight: 0.2, billableWeight: 5,
      orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, calculatedCharge: 250, status: OrderStatus.DELIVERED,
    }
  })
  
  try {
    await prisma.$executeRaw`UPDATE "Order" SET "pickupLocation" = ST_SetSRID(ST_MakePoint(-74.0050, 40.7120), 4326), "dropLocation" = ST_SetSRID(ST_MakePoint(-74.0080, 40.7150), 4326) WHERE id = ${order1.id}`
  } catch(e) {
    throw new Error("PostGIS is required for this project. Ensure the database is running with the PostGIS extension enabled.");
  }

  await prisma.pricingSnapshot.create({
    data: {
      orderId: order1.id, rateConfigurationId: rateConfig.id,
      actualWeight: 5, volumetricWeight: 0.2, billableWeight: 5,
      orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, zoneRelationship: ZoneRelationshipType.INTRA_ZONE,
      appliedRate: 50, appliedCodSurcharge: 0, baseCharge: 250, finalCharge: 250,
      calculationBreakdown: { formulaVersion: "v1", weightBasis: "ACTUAL", zoneRelationship: "INTRA_ZONE", baseRate: 50, billableWeight: 5, baseCharge: 250, codSurcharge: 0, finalCharge: 250 }
    }
  })

  await prisma.deliveryAttempt.create({ data: { orderId: order1.id, agentId: agentProfile1.id, attemptNumber: 1, status: AttemptStatus.SUCCESS, scheduledDate: new Date(), resolvedAt: new Date() } })
  await prisma.trackingHistory.create({ data: { orderId: order1.id, status: OrderStatus.DELIVERED, actorId: agent1.id } })

  const order2 = await prisma.order.create({
    data: {
      customerId: customer2.id, pickupAddress: 'Pickup 2', dropAddress: 'Drop 2',
      pickupZoneId: southZone.id, dropZoneId: northZone.id,
      length: 20, breadth: 20, height: 20, actualWeight: 10, volumetricWeight: 1.6, billableWeight: 10,
      orderType: OrderType.B2C, paymentType: PaymentType.COD, calculatedCharge: 825, status: OrderStatus.FAILED,
    }
  })
  
  try {
    await prisma.$executeRaw`UPDATE "Order" SET "pickupLocation" = ST_SetSRID(ST_MakePoint(-74.0150, 40.6900), 4326), "dropLocation" = ST_SetSRID(ST_MakePoint(-74.0040, 40.7110), 4326) WHERE id = ${order2.id}`
  } catch(e) {
    throw new Error("PostGIS is required for this project. Ensure the database is running with the PostGIS extension enabled.");
  }

  await prisma.pricingSnapshot.create({
    data: {
      orderId: order2.id, rateConfigurationId: rateConfig.id,
      actualWeight: 10, volumetricWeight: 1.6, billableWeight: 10,
      orderType: OrderType.B2C, paymentType: PaymentType.COD, zoneRelationship: ZoneRelationshipType.INTER_ZONE,
      appliedRate: 80, appliedCodSurcharge: 25, baseCharge: 800, finalCharge: 825,
      calculationBreakdown: { formulaVersion: "v1", weightBasis: "ACTUAL", zoneRelationship: "INTER_ZONE", baseRate: 80, billableWeight: 10, baseCharge: 800, codSurcharge: 25, finalCharge: 825 }
    }
  })

  await prisma.deliveryAttempt.create({ data: { orderId: order2.id, agentId: agentProfile2.id, attemptNumber: 1, status: AttemptStatus.FAILED, failureReason: 'Customer not available', scheduledDate: new Date(), resolvedAt: new Date() } })
  await prisma.trackingHistory.create({ data: { orderId: order2.id, status: OrderStatus.FAILED, actorId: agent2.id } })

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
