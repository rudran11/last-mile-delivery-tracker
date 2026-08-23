import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true }});
  console.log("Users:", users.length, users.map(u => u.email + " (" + u.role + ")"));
}
main().finally(() => prisma.$disconnect());
