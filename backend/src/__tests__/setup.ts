import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to DB
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
