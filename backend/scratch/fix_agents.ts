import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.agentProfile.updateMany({
    data: {
      isAvailable: true,
      isActive: true
    }
  });
  console.log("Agents updated successfully");
}
main().finally(() => prisma.$disconnect());
