import { PrismaClient, Role, OrderType, PaymentType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class TestFactory {
  // We keep track of everything created to allow easy scoped cleanup if desired
  static createdUserIds: string[] = [];
  static createdZoneIds: string[] = [];
  static createdOrderIds: string[] = [];
  static createdRateIds: string[] = [];

  static async createZone(name: string) {
    const zone = await prisma.zone.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true }
    });
    this.createdZoneIds.push(zone.id);
    return zone;
  }

  static async createRateConfiguration(data: any = {}) {
    const rate = await prisma.rateConfiguration.create({
      data: {
        b2bIntraZoneRate: 50,
        b2bInterZoneRate: 70,
        b2cIntraZoneRate: 60,
        b2cInterZoneRate: 80,
        b2cCodSurcharge: 25,
        b2bCodSurcharge: 25,
        isActive: true,
        ...data
      }
    });
    this.createdRateIds.push(rate.id);
    return rate;
  }

  static async createUser(role: Role, prefix: string = 'test') {
    const email = `${prefix}_${crypto.randomUUID()}@example.com`;
    const hash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: { email, name: `Test ${role}`, passwordHash: hash, role }
    });
    this.createdUserIds.push(user.id);
    return user;
  }

  static async createAgent(lat: number, lng: number, zoneId: string, isAvailable: boolean = true) {
    const user = await this.createUser(Role.AGENT, 'agent');
    const profile = await prisma.agentProfile.create({
      data: { userId: user.id, currentZoneId: zoneId, isAvailable }
    });
    await prisma.$executeRaw`UPDATE "AgentProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326) WHERE id = ${profile.id}`;
    return { user, profile };
  }

  static async cleanup() {
    // Wait 200ms for any background jobs to settle
    await new Promise(resolve => setTimeout(resolve, 200));

    // Delete in FK order
    await prisma.customerFeedback.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.trackingHistory.deleteMany({});
    await prisma.deliveryAttempt.deleteMany({});
    await prisma.pricingSnapshot.deleteMany({});
    await prisma.order.deleteMany({});
    
    await prisma.rateConfiguration.deleteMany({});
    await prisma.agentProfile.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.area.deleteMany({});
    await prisma.zone.deleteMany({});

    this.createdOrderIds = [];
    this.createdRateIds = [];
    this.createdUserIds = [];
    this.createdZoneIds = [];
  }
}
