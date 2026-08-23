const { PrismaClient } = require('@prisma/client');

// Connect strictly to development DB
const prisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://postgres:postgres@localhost:5432/delivery_tracker" }
  }
});

async function verifyDev() {
  try {
    const agents = await prisma.agentProfile.findMany({ include: { user: true, currentZone: true } });
    const agentCoords = await prisma.$queryRaw`SELECT id, ST_X("currentLocation"::geometry) as lng, ST_Y("currentLocation"::geometry) as lat FROM "AgentProfile"`;
    
    const zones = await prisma.zone.count();
    const areas = await prisma.area.count();
    const orders = await prisma.order.count();
    const rates = await prisma.rateConfiguration.count();
    const feedback = await prisma.customerFeedback.count();
    const attempts = await prisma.deliveryAttempt.count();
    const snapshots = await prisma.pricingSnapshot.count();
    const tracking = await prisma.trackingHistory.count();
    
    console.log(JSON.stringify({
      agents: agents.map(a => {
        const coords = agentCoords.find(c => c.id === a.id);
        return {
          email: a.user.email,
          zone: a.currentZone?.name,
          lat: coords?.lat,
          lng: coords?.lng,
          isActive: a.isActive,
          isAvailable: a.isAvailable
        };
      }),
      counts: { agents: agents.length, zones, areas, orders, attempts, tracking, feedback, snapshots, rates }
    }, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
verifyDev();
