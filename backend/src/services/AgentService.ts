import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgentService {
  static async getAllAgents() {
    // We use queryRaw to extract coordinates safely from PostGIS without leaking internals.
    // We join with User to get the agent's display name.
    const agents = await prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        name: string | null;
        isAvailable: boolean;
        lng: number | null;
        lat: number | null;
      }>
    >`
      SELECT 
        a.id, 
        a."userId", 
        u.email as name, 
        a."isAvailable", 
        ST_X(a."currentLocation"::geometry) as lng, 
        ST_Y(a."currentLocation"::geometry) as lat
      FROM "AgentProfile" a
      JOIN "User" u ON a."userId" = u.id
      WHERE a."isActive" = true
      ORDER BY u.email ASC;
    `;

    return agents.map(agent => ({
      id: agent.id,
      userId: agent.userId,
      name: agent.name,
      isAvailable: agent.isAvailable,
      location: agent.lng !== null && agent.lat !== null ? {
        lat: agent.lat,
        lng: agent.lng
      } : null
    }));
  }
  static async updateStatus(userId: string, isAvailable: boolean) {
    return prisma.agentProfile.update({
      where: { userId },
      data: { isAvailable }
    });
  }
}
