import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://postgres:postgres@localhost:5432/delivery_tracker_test'
    }
  }
});

async function main() {
  console.log('Wiping test database...');
  await prisma.notification.deleteMany({});
  await prisma.trackingHistory.deleteMany({});
  await prisma.customerFeedback.deleteMany({});
  await prisma.deliveryAttempt.deleteMany({});
  await prisma.pricingSnapshot.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.agentProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.rateConfiguration.deleteMany({});
  console.log('Test database wiped successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
