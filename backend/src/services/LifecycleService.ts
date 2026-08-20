import { AttemptStatus, OrderStatus, PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors/DomainError';

const prisma = new PrismaClient();

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ASSIGNED],
  [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.FAILED],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT, OrderStatus.FAILED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.FAILED]: [OrderStatus.ASSIGNED], // or PENDING if rescheduling
};

export class LifecycleService {
  static async updateStatus(orderId: string, actorId: string, newStatus: OrderStatus, actorRole: string, failureReason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryAttempts: {
          orderBy: { attemptNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!order) throw new NotFoundError('Order not found');

    const validNextStates = VALID_TRANSITIONS[order.status] || [];
    if (!validNextStates.includes(newStatus)) {
      throw new BadRequestError(`Invalid status transition from ${order.status} to ${newStatus}`);
    }

    const currentAttempt = order.deliveryAttempts[0];
    
    // Ensure agent authorization
    if (actorRole === 'AGENT') {
      if (!currentAttempt || currentAttempt.status !== AttemptStatus.ASSIGNED && currentAttempt.status !== AttemptStatus.IN_PROGRESS) {
        throw new ForbiddenError('No active delivery attempt found');
      }
      // Check if this agent is the one assigned
      const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: actorId } });
      if (!agentProfile || currentAttempt.agentId !== agentProfile.id) {
        throw new ForbiddenError('You are not assigned to this order');
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus }
      });

      // 2. Insert Tracking History
      const trackingHistory = await tx.trackingHistory.create({
        data: {
          orderId,
          status: newStatus,
          actorId,
          metadata: JSON.stringify({ event: 'STATUS_UPDATE', failureReason })
        }
      });

      // 3. Handle specific lifecycle changes (Failed/Delivered)
      if (newStatus === OrderStatus.FAILED) {
        if (!failureReason) throw new BadRequestError('Failure reason is required when marking order as failed');
        if (currentAttempt) {
          await tx.deliveryAttempt.update({
            where: { id: currentAttempt.id },
            data: { status: AttemptStatus.FAILED, failureReason, resolvedAt: new Date() }
          });
          // Free the agent
          await tx.agentProfile.update({
            where: { id: currentAttempt.agentId },
            data: { isAvailable: true }
          });
        }
      } else if (newStatus === OrderStatus.DELIVERED) {
        if (currentAttempt) {
          await tx.deliveryAttempt.update({
            where: { id: currentAttempt.id },
            data: { status: AttemptStatus.SUCCESS, resolvedAt: new Date() }
          });
          // Free the agent
          await tx.agentProfile.update({
            where: { id: currentAttempt.agentId },
            data: { isAvailable: true }
          });
        }
      } else if (newStatus === OrderStatus.PICKED_UP || newStatus === OrderStatus.IN_TRANSIT || newStatus === OrderStatus.OUT_FOR_DELIVERY) {
        if (currentAttempt && currentAttempt.status === AttemptStatus.ASSIGNED) {
          await tx.deliveryAttempt.update({
            where: { id: currentAttempt.id },
            data: { status: AttemptStatus.IN_PROGRESS }
          });
        }
      }

      return { order: updatedOrder, trackingHistory };
    });
  }

  static async rescheduleOrder(orderId: string, customerId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) throw new NotFoundError('Order not found');
    if (order.customerId !== customerId) throw new ForbiddenError('You do not own this order');
    if (order.status !== OrderStatus.FAILED) throw new BadRequestError('Only FAILED orders can be rescheduled');

    return await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PENDING }
      });

      const trackingHistory = await tx.trackingHistory.create({
        data: {
          orderId,
          status: OrderStatus.PENDING,
          actorId: customerId,
          metadata: JSON.stringify({ event: 'RESCHEDULED' })
        }
      });

      return { order: updatedOrder, trackingHistory };
    });
  }
}
