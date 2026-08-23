import { PrismaClient, AttemptStatus, OrderStatus } from '@prisma/client';
import { NotFoundError } from '../errors/DomainError';

const prisma = new PrismaClient();

export class AdminPerformanceService {
  static async getAgentPerformance(agentId: string) {
    // 1. Fetch Agent Profile & User Details
    const agentProfile = await prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        name: string | null;
        email: string;
        isAvailable: boolean;
        isActive: boolean;
        zoneName: string | null;
        lng: number | null;
        lat: number | null;
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
        ST_X(a."currentLocation"::geometry) as lng, 
        ST_Y(a."currentLocation"::geometry) as lat
      FROM "AgentProfile" a
      JOIN "User" u ON a."userId" = u.id
      LEFT JOIN "Zone" z ON a."currentZoneId" = z.id
      WHERE a.id = ${agentId}
      LIMIT 1;
    `;

    if (!agentProfile || agentProfile.length === 0) {
      throw new NotFoundError('Agent not found');
    }

    const agent = agentProfile[0];

    // 2. Performance Metrics from DeliveryAttempts
    const attempts = await prisma.deliveryAttempt.findMany({
      where: { agentId },
      include: {
        order: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const completedDeliveries = attempts.filter(a => a.status === AttemptStatus.SUCCESS);
    const failedAttempts = attempts.filter(a => a.status === AttemptStatus.FAILED);
    const totalDeliveries = completedDeliveries.length + failedAttempts.length;

    // Calculate Average Delivery Time (only for successes)
    let totalTimeMs = 0;
    completedDeliveries.forEach(a => {
      if (a.resolvedAt) {
        totalTimeMs += a.resolvedAt.getTime() - a.createdAt.getTime();
      }
    });
    
    // Average in minutes
    const averageDeliveryTimeMinutes = completedDeliveries.length > 0 
      ? Math.round(totalTimeMs / completedDeliveries.length / 60000) 
      : 0;

    // 3. Current Active Assignment
    const currentAssignment = attempts.find(a => 
      a.status === AttemptStatus.ASSIGNED || a.status === AttemptStatus.IN_PROGRESS
    );

    // 4. Rating Aggregation
    const feedbackStats = await prisma.customerFeedback.aggregate({
      where: { agentId },
      _avg: { rating: true },
      _count: { id: true }
    });

    const averageRating = feedbackStats._avg.rating || 0;
    const totalRatings = feedbackStats._count.id;

    // 5. Rating Distribution
    const distributionRaw = await prisma.customerFeedback.groupBy({
      by: ['rating'],
      where: { agentId },
      _count: { id: true }
    });

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    distributionRaw.forEach(d => {
      ratingDistribution[d.rating] = d._count.id;
    });

    // 6. Recent Feedback
    const recentFeedback = await prisma.customerFeedback.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        order: { select: { id: true } }
      }
    });

    // 7. Delivery History (incorporating feedback)
    const recentAttempts = attempts.slice(0, 50); // limit to 50 for performance view
    const orderIds = recentAttempts.map(a => a.orderId);
    const historyFeedback = await prisma.customerFeedback.findMany({
      where: { orderId: { in: orderIds }, agentId },
    });

    const deliveryHistory = recentAttempts.map(a => {
      const feedback = historyFeedback.find(f => f.orderId === a.orderId);
      return {
        id: a.id,
        orderId: a.orderId,
        status: a.status,
        failureReason: a.failureReason,
        createdAt: a.createdAt,
        resolvedAt: a.resolvedAt,
        orderPickup: a.order.pickupAddress,
        orderDrop: a.order.dropAddress,
        rating: feedback ? feedback.rating : null
      };
    });

    return {
      agent,
      metrics: {
        totalDeliveries,
        completedDeliveries: completedDeliveries.length,
        failedAttempts: failedAttempts.length,
        averageDeliveryTimeMinutes,
        averageRating,
        totalRatings,
        ratingDistribution
      },
      currentAssignment: currentAssignment ? {
        id: currentAssignment.id,
        orderId: currentAssignment.orderId,
        status: currentAssignment.status,
        pickupAddress: currentAssignment.order.pickupAddress,
        dropAddress: currentAssignment.order.dropAddress,
        createdAt: currentAssignment.createdAt
      } : null,
      recentFeedback,
      deliveryHistory
    };
  }
}
