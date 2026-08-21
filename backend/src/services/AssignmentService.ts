import { AttemptStatus, OrderStatus, PrismaClient } from '@prisma/client';
import { BadRequestError, ConcurrencyError, NotFoundError } from '../errors/DomainError';

const prisma = new PrismaClient();

export class AssignmentService {
  static async assignAgent(orderId: string, actorId: string) {
    // 1. Fetch Order and confirm it is PENDING
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestError('Order is not in PENDING state');
    }

    // 2. Query nearest eligible available agent using PostGIS
    // The pickupLocation is geometry in DB, we extract lon/lat or use ST_Distance directly if we have the order's pickupLocation.
    // However, since we might not have the raw point in standard Prisma query, we can query the DB to do the PostGIS distance check:
    
    // We order by distance, then id (deterministic tie-breaking).
    const nearestAgents = await prisma.$queryRaw<
      Array<{ id: string; distance: number }>
    >`
      SELECT 
        a.id,
        ST_Distance(a."currentLocation", COALESCE(o."pickupLocation", ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326))) as distance
      FROM "AgentProfile" a
      CROSS JOIN "Order" o
      WHERE o.id = ${orderId} 
        AND a."isAvailable" = true
        AND a."isActive" = true
        AND a."currentLocation" IS NOT NULL
      ORDER BY distance ASC, a.id ASC
      LIMIT 1;
    `;

    if (!nearestAgents || nearestAgents.length === 0 || !nearestAgents[0]) {
      throw new BadRequestError('No eligible available agent found');
    }

    const selectedAgentId = nearestAgents[0].id;
    const calculatedDistance = nearestAgents[0].distance;

    // 3. Atomically attempt to claim the agent (Concurrency enforcement)
    const result = await prisma.$transaction(async (tx) => {
      const updatedAgent = await tx.agentProfile.updateMany({
        where: { id: selectedAgentId, isAvailable: true },
        data: { isAvailable: false }
      });

      // If updatedAgent.count === 0, the agent was claimed by another transaction simultaneously.
      if (updatedAgent.count === 0) {
        throw new ConcurrencyError('Agent was claimed by another process. Please retry assignment.');
      }

      // Check current attempts to get attemptNumber (usually 1, but could be higher if rescheduled)
      const existingAttempts = await tx.deliveryAttempt.count({
        where: { orderId }
      });
      const attemptNumber = existingAttempts + 1;

      // 4. Create DeliveryAttempt, Update Order status, Insert TrackingHistory in one transaction
      const deliveryAttempt = await tx.deliveryAttempt.create({
        data: {
          orderId,
          agentId: selectedAgentId,
          attemptNumber,
          status: AttemptStatus.ASSIGNED,
          scheduledDate: new Date(),
        }
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ASSIGNED }
      });

      const trackingHistory = await tx.trackingHistory.create({
        data: {
          orderId,
          status: OrderStatus.ASSIGNED,
          actorId,
          metadata: JSON.stringify({
            event: 'AGENT_ASSIGNED',
            agentId: selectedAgentId,
            distance: calculatedDistance,
            attemptNumber
          })
        }
      });

      return {
        order: updatedOrder,
        deliveryAttempt,
        trackingHistory,
        assignmentDetails: {
          agentId: selectedAgentId,
          distance: calculatedDistance
        }
      };
    });

    return result;
  }
}
