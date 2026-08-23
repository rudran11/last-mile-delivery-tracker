const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'brainless1928@gmail.com' }
  });

  if (!user) {
    console.log('User not found.');
  } else {
    console.log('User exists:', user.id);
  }
}

main().finally(() => prisma.$disconnect());
