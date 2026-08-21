import { AttemptStatus, OrderStatus, PrismaClient } from '@prisma/client';
import { BadRequestError, ConcurrencyError, NotFoundError } from '../errors/DomainError';

const prisma = new PrismaClient();

export class AssignmentService {
  static async assignAgent(orderId: string, actorId: string, scheduledDate?: Date) {
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
        ST_Distance(a."currentLocation", o."pickupLocation") as distance
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
          scheduledDate: scheduledDate || new Date(),
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

      const agentProfile = await tx.agentProfile.findUnique({
        where: { id: selectedAgentId },
        include: { user: true }
      });

      return {
        order: updatedOrder,
        deliveryAttempt,
        trackingHistory,
        assignmentDetails: {
          agentId: selectedAgentId,
          agentEmail: agentProfile?.user.email,
          distance: calculatedDistance
        }
      };
    });

    import('./NotificationService').then(({ NotificationService }) => {
      import('@prisma/client').then(({ NotificationEvent }) => {
        NotificationService.emit(result.order.id, NotificationEvent.ASSIGNED, `assigned-${result.deliveryAttempt.id}`).catch(err => {
          console.error('Failed to dispatch notification', err);
        });
      });
    });

    return result;
  }

  static async manualReassign(orderId: string, targetAgentId: string, actorId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryAttempts: { orderBy: { attemptNumber: 'desc' }, take: 1 } }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ASSIGNED) {
      throw new BadRequestError('Order cannot be reassigned in its current state');
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetAgent = await tx.agentProfile.findFirst({
        where: { id: targetAgentId, isAvailable: true, isActive: true }
      });

      if (!targetAgent) {
        throw new BadRequestError('Selected agent is not available or does not exist');
      }

      const currentAttempt = order.deliveryAttempts[0];
      
      if (order.status === OrderStatus.ASSIGNED && currentAttempt && currentAttempt.agentId === targetAgentId) {
        throw new BadRequestError('Agent is already assigned to this order');
      }

      if (order.status === OrderStatus.ASSIGNED && currentAttempt && currentAttempt.status === AttemptStatus.ASSIGNED) {
        await tx.agentProfile.update({
          where: { id: currentAttempt.agentId },
          data: { isAvailable: true }
        });
        
        await tx.deliveryAttempt.update({
          where: { id: currentAttempt.id },
          data: { status: AttemptStatus.FAILED }
        });
      }

      const updatedAgent = await tx.agentProfile.updateMany({
        where: { id: targetAgentId, isAvailable: true },
        data: { isAvailable: false }
      });

      if (updatedAgent.count === 0) {
        throw new ConcurrencyError('Agent was claimed by another process. Please retry assignment.');
      }

      const attemptNumber = currentAttempt ? currentAttempt.attemptNumber + 1 : 1;

      const deliveryAttempt = await tx.deliveryAttempt.create({
        data: {
          orderId,
          agentId: targetAgentId,
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
            event: 'MANUAL_REASSIGNMENT',
            agentId: targetAgentId,
            attemptNumber
          })
        }
      });

      return {
        order: updatedOrder,
        deliveryAttempt,
        trackingHistory,
        assignmentDetails: {
          agentId: targetAgentId
        }
      };
    });

    return result;
  }
}
