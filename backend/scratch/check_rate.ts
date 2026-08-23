import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.rateConfiguration.findFirst().then(c => console.log(c ? "Exists" : "Missing")).finally(() => prisma.$disconnect());
