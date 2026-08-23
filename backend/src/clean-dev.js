const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres:postgres@localhost:5432/delivery_tracker" } }
});

async function cleanDevDb() {
  try {
    const leakedEmails = [
      'new_agent_123_1787476403371@test.com',
      'new_agent_123@test.com',
      'agent5_kerala_1787476403388@test.com'
    ];
    
    // Delete Agent Profiles first
    await prisma.agentProfile.deleteMany({
      where: { user: { email: { in: leakedEmails } } }
    });
    
    // Delete leaked users
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { in: leakedEmails } },
          { email: { startsWith: 'admin_agent_api_' } },
          { email: { startsWith: 'customer_agent_api_' } },
          { email: { startsWith: 'admin_dispatch_' } },
          { email: { startsWith: 'cust_dispatch_' } },
          { email: { startsWith: 'otp_test_' } },
          { email: { startsWith: 'unverified_' } },
          { email: { startsWith: 'admin_inject_' } },
          { email: { startsWith: 'agent_inject_' } },
          { email: { startsWith: 'another@example.com' } }
        ]
      }
    });

    // Delete leaked pending registrations
    await prisma.pendingRegistration.deleteMany({
      where: {
        OR: [
          { email: { startsWith: 'otp_test_' } },
          { email: { startsWith: 'unverified_' } },
          { email: { startsWith: 'admin_inject_' } },
          { email: { startsWith: 'agent_inject_' } },
          { email: { startsWith: 'another@example.com' } }
        ]
      }
    });

    console.log("Dev DB cleaned.");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDevDb();
