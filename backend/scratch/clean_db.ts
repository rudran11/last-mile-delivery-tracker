import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB cleanup...');

  // 1. Delete all transactional data (Orders, Attempts, Tracking, Notifications, Snapshots)
  // This ensures no test pollution remains in operational tables
  console.log('Deleting all transactional data...');
  await prisma.notification.deleteMany({});
  await prisma.trackingHistory.deleteMany({});
  await prisma.deliveryAttempt.deleteMany({});
  await prisma.pricingSnapshot.deleteMany({});
  await prisma.order.deleteMany({});

  // 2. Delete test Zones
  const testZones = await prisma.zone.findMany({
    where: {
      OR: [
        { name: { contains: 'TestZone' } },
        { name: { contains: 'Admin Test Zone' } },
        { name: { contains: 'Test Zone' } }
      ]
    }
  });

  console.log(`Found ${testZones.length} test zones to delete.`);
  
  for (const zone of testZones) {
    await prisma.area.deleteMany({ where: { zoneId: zone.id } });
    await prisma.zoneAdjacency.deleteMany({ where: { zoneId: zone.id } });
    await prisma.zoneAdjacency.deleteMany({ where: { adjacentZoneId: zone.id } });
    await prisma.zone.delete({ where: { id: zone.id } });
  }

  // 3. Delete test Agents
  const testUsers = await prisma.user.findMany({
    where: {
      role: Role.AGENT,
    },
    include: { agentProfile: true }
  });

  const legitEmails = ['agent1@unthinkable.co', 'agent2@test.com', 'agent3@test.com', 'agent4@test.com'];
  const toDelete = testUsers.filter(u => !legitEmails.includes(u.email));

  console.log(`Found ${toDelete.length} test agents to delete.`);

  for (const user of toDelete) {
    if (user.agentProfile) {
      await prisma.agentProfile.delete({ where: { id: user.agentProfile.id } });
    }
    await prisma.user.delete({ where: { id: user.id } });
  }

  // 4. Delete test Customers (if any)
  const testCustomers = await prisma.user.findMany({
    where: {
      role: Role.CUSTOMER,
      OR: [
        { email: { startsWith: 'cust_dispatch' } },
        { email: { startsWith: 'customer_agent_api' } }
      ]
    }
  });

  console.log(`Found ${testCustomers.length} test customers to delete.`);
  for (const user of testCustomers) {
    await prisma.user.delete({ where: { id: user.id } });
  }

  // 5. Restore baseline agents availability to seed state
  // Agent 1: Available, Agent 2: Available, Agent 3: Unavailable, Agent 4: Available
  console.log('Restoring agent availability...');
  
  const a1 = await prisma.user.findUnique({ where: { email: 'agent1@unthinkable.co' }, include: { agentProfile: true }});
  const a2 = await prisma.user.findUnique({ where: { email: 'agent2@test.com' }, include: { agentProfile: true }});
  const a3 = await prisma.user.findUnique({ where: { email: 'agent3@test.com' }, include: { agentProfile: true }});
  const a4 = await prisma.user.findUnique({ where: { email: 'agent4@test.com' }, include: { agentProfile: true }});

  if (a1?.agentProfile) await prisma.agentProfile.update({ where: { id: a1.agentProfile.id }, data: { isAvailable: true, isActive: true } });
  if (a2?.agentProfile) await prisma.agentProfile.update({ where: { id: a2.agentProfile.id }, data: { isAvailable: true, isActive: true } });
  if (a3?.agentProfile) await prisma.agentProfile.update({ where: { id: a3.agentProfile.id }, data: { isAvailable: false, isActive: true } });
  if (a4?.agentProfile) await prisma.agentProfile.update({ where: { id: a4.agentProfile.id }, data: { isAvailable: true, isActive: true } });

  await prisma.user.updateMany({
    where: { email: { in: legitEmails } },
    data: { isActive: true }
  });

  console.log('Cleanup complete.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
