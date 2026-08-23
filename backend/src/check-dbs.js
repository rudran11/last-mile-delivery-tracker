const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://postgres:postgres@localhost:5432/postgres" }
  }
});

async function checkAndCreate() {
  try {
    const dbs = await prisma.$queryRaw`SELECT datname FROM pg_database;`;
    const names = dbs.map(d => d.datname);
    console.log("Existing databases:", names);
    
    if (!names.includes('delivery_tracker_test')) {
      console.log("Test database does not exist. Attempting to create...");
      // Prisma cannot execute CREATE DATABASE in a standard transaction/prepared statement easily
      // We will just inform the output so we can run raw if needed.
      console.log("PLEASE_CREATE_DB");
    } else {
      console.log("delivery_tracker_test already exists.");
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
checkAndCreate();
