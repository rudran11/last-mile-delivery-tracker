import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CreateAgentInput, UpdateAgentInput } from '../validators/agentValidators';
import { ConflictError, NotFoundError } from '../errors/DomainError';
import { OrderService } from './OrderService';

const prisma = new PrismaClient();

export class AdminAgentService {
  static async getAgents() {
    const agents = await prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        name: string | null;
        email: string;
        isAvailable: boolean;
        isActive: boolean;
        lng: number | null;
        lat: number | null;
        zoneName: string | null;
        zoneId: string | null;
      }>
    >`
      SELECT 
        a.id, 
        a."userId", 
        u.name,
        u.email,
        a."isAvailable", 
        a."isActive",
        z.name as "zoneName",
        z.id as "zoneId",
        ST_X(a."currentLocation"::geometry) as lng, 
        ST_Y(a."currentLocation"::geometry) as lat
      FROM "AgentProfile" a
      JOIN "User" u ON a."userId" = u.id
      LEFT JOIN "Zone" z ON a."currentZoneId" = z.id
      WHERE u."isActive" = true AND a."isActive" = true
      ORDER BY u.email ASC;
    `;
    
    return agents.map(agent => {
      const { lat, lng, ...rest } = agent;
      return {
        ...rest,
        location: (lat !== null && lng !== null) ? { lat, lng } : null
      };
    });
  }

  static async createAgent(data: CreateAgentInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const locationInfo = await OrderService.resolveLocation(data.lat, data.lng).catch(() => null);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'AGENT',
          emailVerifiedAt: new Date(), // Pre-verified since Admin created it
        },
      });

      const profile = await tx.agentProfile.create({
        data: {
          userId: user.id,
          isAvailable: data.isAvailable,
          isActive: true,
          currentZoneId: locationInfo ? locationInfo.zoneId : null,
        },
      });

      await tx.$executeRaw`
        UPDATE "AgentProfile" 
        SET "currentLocation" = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326) 
        WHERE id = ${profile.id}
      `;

      return { user, profile };
    });

    return result;
  }

  static async updateAgent(id: string, data: UpdateAgentInput) {
    const profile = await prisma.agentProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!profile || !profile.isActive) {
      throw new NotFoundError('Agent not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: profile.userId },
        data: { name: data.name }
      });

      const updateData: any = { isAvailable: data.isAvailable };
      if (data.zoneId !== undefined) {
        updateData.currentZoneId = data.zoneId;
      }

      const updatedProfile = await tx.agentProfile.update({
        where: { id },
        data: updateData
      });

      await tx.$executeRaw`
        UPDATE "AgentProfile" 
        SET "currentLocation" = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326) 
        WHERE id = ${id}
      `;

      return { user: updatedUser, profile: updatedProfile };
    });

    return result;
  }

  static async deactivateAgent(id: string) {
    const profile = await prisma.agentProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundError('Agent not found');
    }

    // Soft delete both AgentProfile and User
    await prisma.$transaction([
      prisma.agentProfile.update({
        where: { id },
        data: { isActive: false, isAvailable: false }
      }),
      prisma.user.update({
        where: { id: profile.userId },
        data: { isActive: false }
      })
    ]);

    return { success: true };
  }
}
