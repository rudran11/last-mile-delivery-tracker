import { PrismaClient } from '@prisma/client';
import { BadRequestError } from '../errors/DomainError';

const prisma = new PrismaClient();

export class ZoneService {
  // --- ZONES ---
  static async getAllZones() {
    return await prisma.zone.findMany({
      include: {
        areas: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  static async createZone(name: string, isActive: boolean = true) {
    const existing = await prisma.zone.findUnique({ where: { name } });
    if (existing) throw new BadRequestError('Zone name already exists');
    return await prisma.zone.create({
      data: { name, isActive }
    });
  }

  static async updateZone(id: string, name: string, isActive: boolean) {
    const existing = await prisma.zone.findUnique({ where: { name } });
    if (existing && existing.id !== id) throw new BadRequestError('Zone name already exists');
    return await prisma.zone.update({
      where: { id },
      data: { name, isActive }
    });
  }

  // --- AREAS ---
  static async getAllAreas() {
    return await prisma.area.findMany({
      include: {
        zone: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  static async createArea(name: string, pincode: string, zoneId: string, isActive: boolean = true) {
    // A pincode can be mapped to different areas? PDF says: "Do NOT make pincode globally unique...".
    // We just check if the zone exists.
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new BadRequestError('Zone not found');

    return await prisma.area.create({
      data: { name, pincode, zoneId, isActive }
    });
  }

  static async updateArea(id: string, name: string, pincode: string, zoneId: string, isActive: boolean) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new BadRequestError('Zone not found');

    return await prisma.area.update({
      where: { id },
      data: { name, pincode, zoneId, isActive }
    });
  }
}
