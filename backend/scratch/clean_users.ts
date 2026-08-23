import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const allUsers = await prisma.user.findMany();
  const legitimateEmails = [
    "admin@unthinkable.co",
    "customer@unthinkable.co",
    "customer2@test.com",
    "agent1@unthinkable.co",
    "agent2@test.com",
    "agent3@test.com",
    "agent4@test.com",
    "brainless1928@gmail.com",
    "logintest@test.com"
  ];
  const toDelete = allUsers.filter(u => !legitimateEmails.includes(u.email));
  console.log("Deleting " + toDelete.length + " test users...");
  for (const u of toDelete) {
    // Delete their OTPs
    await prisma.pendingRegistration.deleteMany({ where: { email: u.email } });
    await prisma.user.delete({ where: { id: u.id } });
  }
  console.log("Deleted test users.");
}
main().finally(() => prisma.$disconnect());
