import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== AGENTS ===');
  const agents = await prisma.user.findMany({
    where: { role: Role.AGENT },
    include: { agentProfile: true }
  });

  for (const agent of agents) {
    let point: any = null;
    if (agent.agentProfile) {
      const result = await prisma.$queryRaw<any[]>`
        SELECT ST_X("currentLocation"::geometry) as lng, ST_Y("currentLocation"::geometry) as lat 
        FROM "AgentProfile" WHERE id = ${agent.agentProfile.id}
      `;
      if (result.length > 0) {
        point = result[0];
      }
    }
    
    console.log(JSON.stringify({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      isActive: agent.isActive,
      agentProfile: agent.agentProfile ? {
        id: agent.agentProfile.id,
        isAvailable: agent.agentProfile.isAvailable,
        isActive: agent.agentProfile.isActive,
        lat: point?.lat,
        lng: point?.lng
      } : null
    }));
  }

  console.log('\n=== ZONES ===');
  const zones = await prisma.zone.findMany();
  for (const z of zones) {
    console.log(JSON.stringify(z));
  }

  console.log('\n=== AREAS ===');
  const areas = await prisma.area.findMany();
  for (const a of areas) {
    console.log(JSON.stringify(a));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
