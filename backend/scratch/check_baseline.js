const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const users = await p.user.findMany();
  const zones = await p.zone.findMany();
  const areas = await p.area.findMany();
  const rateConfigs = await p.rateConfiguration.findMany();
  const agents = await p.agentProfile.findMany();

  console.log('Users:', users.map(u => u.email));
  console.log('Zones:', zones.map(z => z.name));
  console.log('Areas Count:', areas.length);
  console.log('Rate Configs Count:', rateConfigs.length);
  console.log('Agents Count:', agents.length);
}

run().finally(() => p.$disconnect());
