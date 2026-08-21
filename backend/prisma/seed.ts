import { PrismaClient, Role, OrderType, PaymentType, OrderStatus, AttemptStatus, ZoneRelationshipType } from '@prisma/client'
import bcrypt from 'bcrypt';

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);
  const agentHash = await bcrypt.hash('agent123', 10);

  // 1. Users
  const admin = await prisma.user.create({ data: { email: 'admin@unthinkable.co', name: 'System Admin', passwordHash: adminHash, role: Role.ADMIN } })
  const customer1 = await prisma.user.create({ data: { email: 'customer@unthinkable.co', name: 'John Doe', passwordHash: customerHash, role: Role.CUSTOMER } })
  const customer2 = await prisma.user.create({ data: { email: 'customer2@test.com', name: 'Jane Smith', passwordHash: customerHash, role: Role.CUSTOMER } })

  // Agents
  const agent1 = await prisma.user.create({ data: { email: 'agent1@unthinkable.co', name: 'Agent One', passwordHash: agentHash, role: Role.AGENT } })
  const agent2 = await prisma.user.create({ data: { email: 'agent2@test.com', name: 'Agent Two', passwordHash: agentHash, role: Role.AGENT } })
  const agent3 = await prisma.user.create({ data: { email: 'agent3@test.com', name: 'Agent Three', passwordHash: agentHash, role: Role.AGENT } })
  const agent4 = await prisma.user.create({ data: { email: 'agent4@test.com', name: 'Agent Four', passwordHash: agentHash, role: Role.AGENT } })

  // 2. Zones & Areas
  const northZone = await prisma.zone.create({ data: { name: 'North Zone' } })
  const westZone = await prisma.zone.create({ data: { name: 'West Zone' } })
  const southZone = await prisma.zone.create({ data: { name: 'South Zone' } })
  const eastZone = await prisma.zone.create({ data: { name: 'East Zone' } })
  
  await prisma.area.createMany({
    data: [
      { name: 'Delhi NCR', pincode: '110001', zoneId: northZone.id },
      { name: 'Okhla', pincode: '110020', zoneId: northZone.id },
      { name: 'Mumbai Metro', pincode: '400001', zoneId: westZone.id },
      { name: 'Bandra', pincode: '400050', zoneId: westZone.id },
      { name: 'Chennai Central', pincode: '600001', zoneId: southZone.id },
      { name: 'T Nagar', pincode: '600017', zoneId: southZone.id },
      { name: 'Kolkata Metro', pincode: '700001', zoneId: eastZone.id },
      { name: 'Salt Lake', pincode: '700091', zoneId: eastZone.id },
    ]
  })
  
  await prisma.zoneAdjacency.createMany({
    data: [
      { zoneId: northZone.id, adjacentZoneId: westZone.id, priority: 1 },
      { zoneId: westZone.id, adjacentZoneId: southZone.id, priority: 1 },
      { zoneId: eastZone.id, adjacentZoneId: northZone.id, priority: 1 },
    ]
  })

  // Agent Profiles
  const agentProfile1 = await prisma.agentProfile.create({ data: { userId: agent1.id, isAvailable: true, currentZoneId: northZone.id } }) // Delhi
  const agentProfile2 = await prisma.agentProfile.create({ data: { userId: agent2.id, isAvailable: true, currentZoneId: southZone.id } }) // Chennai
  const agentProfile3 = await prisma.agentProfile.create({ data: { userId: agent3.id, isAvailable: false, currentZoneId: westZone.id } }) // Mumbai - Unavailable
  const agentProfile4 = await prisma.agentProfile.create({ data: { userId: agent4.id, isAvailable: true, currentZoneId: eastZone.id } }) // Kolkata

  // UPDATE AGENT COORDINATES via Raw SQL
  try {
    // Agent 1 = Delhi Connaught Place (Lat: 28.6328, Lng: 77.2167)
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(77.2167, 28.6328), 4326) WHERE id = ${agentProfile1.id}`
    // Agent 2 = Chennai T Nagar (Lat: 13.0400, Lng: 80.2300)
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(80.2300, 13.0400), 4326) WHERE id = ${agentProfile2.id}`
    // Agent 3 = Mumbai Fort (Lat: 18.9322, Lng: 72.8339) but unavailable
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(72.8339, 18.9322), 4326) WHERE id = ${agentProfile3.id}`
    // Agent 4 = Kolkata (Lat: 22.5726, Lng: 88.3639)
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(88.3639, 22.5726), 4326) WHERE id = ${agentProfile4.id}`
  } catch(e) {
    throw new Error("PostGIS is required for this project.");
  }

  // 3. Rate Configuration
  const rateConfig = await prisma.rateConfiguration.create({
    data: { b2bIntraZoneRate: 50, b2bInterZoneRate: 70, b2cIntraZoneRate: 60, b2cInterZoneRate: 80, b2bCodSurcharge: 25, b2cCodSurcharge: 30, isActive: true }
  })

  // 4. Orders
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id, pickupAddress: 'Connaught Place, New Delhi', dropAddress: 'Bandra, Mumbai',
      pickupZoneId: northZone.id, dropZoneId: northZone.id,
      length: 10, breadth: 10, height: 10, actualWeight: 5, volumetricWeight: 0.2, billableWeight: 5,
      orderType: OrderType.B2B, paymentType: PaymentType.PREPAID, calculatedCharge: 250, status: OrderStatus.DELIVERED,
    }
  })
  
  try {
    await prisma.$executeRaw`UPDATE "Order" SET "pickupLocation" = ST_SetSRID(ST_MakePoint(77.2167, 28.6328), 4326), "dropLocation" = ST_SetSRID(ST_MakePoint(72.8400, 19.0596), 4326) WHERE id = ${order1.id}`
  } catch(e) {
    throw new Error("PostGIS is required.");
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
      customerId: customer2.id, pickupAddress: 'T Nagar, Chennai', dropAddress: 'Andheri, Mumbai',
      pickupZoneId: southZone.id, dropZoneId: northZone.id,
      length: 20, breadth: 20, height: 20, actualWeight: 10, volumetricWeight: 1.6, billableWeight: 10,
      orderType: OrderType.B2C, paymentType: PaymentType.COD, calculatedCharge: 825, status: OrderStatus.FAILED,
    }
  })
  
  try {
    await prisma.$executeRaw`UPDATE "Order" SET "pickupLocation" = ST_SetSRID(ST_MakePoint(80.2300, 13.0400), 4326), "dropLocation" = ST_SetSRID(ST_MakePoint(72.8300, 19.1100), 4326) WHERE id = ${order2.id}`
  } catch(e) {
    throw new Error("PostGIS is required.");
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
