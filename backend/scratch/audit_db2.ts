import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const zones = await prisma.zone.findMany();
  console.log("Zones:", zones.length, zones.map(z => z.name));
  const agents = await prisma.agentProfile.findMany({ include: { user: true, currentZone: true }});
  console.log("Agents:", agents.length, agents.map(a => a.user.email + " | " + a.isAvailable + " | " + a.isActive + " | " + (a.currentZone ? a.currentZone.name : "None")));
}
main().finally(() => prisma.$disconnect());
