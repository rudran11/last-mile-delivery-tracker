import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ZoneService {
  static async getAllZones() {
    return await prisma.zone.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
  }
}
