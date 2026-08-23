import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Attempt to load test env
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const testDbUrl = process.env.DATABASE_URL_TEST;

// 1. HARD SAFETY GUARD: Fail if test URL is missing
if (!testDbUrl) {
  console.error("🚨 CRITICAL: DATABASE_URL_TEST is not defined in the environment.");
  console.error("Test execution aborted to prevent accidental development database pollution.");
  process.exit(1);
}

// 2. HARD SAFETY GUARD: Fail if test URL does not clearly identify as a test database
const isIdentifiableTestDb = testDbUrl.includes('_test') || testDbUrl.includes('-test') || testDbUrl.includes('testdb');
if (!isIdentifiableTestDb) {
  console.error(`🚨 CRITICAL: DATABASE_URL_TEST ("${testDbUrl}") does not appear to point to a dedicated test database (must contain '_test' or '-test' in the DB name).`);
  console.error("Test execution aborted to prevent accidental development database pollution.");
  process.exit(1);
}

// Ensure the standard DATABASE_URL is not silently used by Prisma
if (process.env.DATABASE_URL === testDbUrl) {
  console.error("🚨 CRITICAL: DATABASE_URL_TEST is identical to DATABASE_URL.");
  console.error("Test execution aborted to prevent accidental development database pollution.");
  process.exit(1);
}

// 3. Point PrismaClient strictly to the Test Database
process.env.DATABASE_URL = testDbUrl; // Crucial for the app endpoints!

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDbUrl,
    },
  },
});

beforeAll(async () => {
  // Connect to DB
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
