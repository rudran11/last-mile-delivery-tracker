import { PrismaClient, Role, OrderStatus, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../errors/DomainError';

const prisma = new PrismaClient();

export interface OrderFilters {
  status?: string;
  zoneId?: string;
  agentId?: string;
}

export class OrderQueryService {
  static async listOrders(userId: string, role: Role, filters?: OrderFilters) {
    if (role === Role.ADMIN) {
      const whereClause: Prisma.OrderWhereInput = {};
      if (filters?.status) whereClause.status = filters.status as OrderStatus;
      if (filters?.zoneId) {
        whereClause.OR = [
          { pickupZoneId: filters.zoneId },
          { dropZoneId: filters.zoneId }
        ];
      }
      if (filters?.agentId) {
        whereClause.deliveryAttempts = {
          some: { agentId: filters.agentId }
        };
      }

      return await prisma.order.findMany({
        where: whereClause,
        include: { pricingSnapshot: true, trackingHistory: true, deliveryAttempts: true, customerFeedback: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === Role.CUSTOMER) {
      return await prisma.order.findMany({
        where: { customerId: userId },
        include: { pricingSnapshot: true, trackingHistory: true, deliveryAttempts: true, customerFeedback: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === Role.AGENT) {
      const agentProfile = await prisma.agentProfile.findUnique({ where: { userId } });
      if (!agentProfile) throw new ForbiddenError('Agent profile not found');
      return await prisma.order.findMany({
        where: {
          deliveryAttempts: {
            some: { agentId: agentProfile.id }
          }
        },
        include: { pricingSnapshot: true, trackingHistory: true, deliveryAttempts: true, customerFeedback: true }
      });
    }
    throw new ForbiddenError('Invalid role');
  }

  static async getOrderById(orderId: string, userId: string, role: Role) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pricingSnapshot: true, trackingHistory: true, deliveryAttempts: true, customerFeedback: true }
    });

    if (!order) throw new NotFoundError('Order not found');

    if (role === Role.CUSTOMER && order.customerId !== userId) {
      throw new ForbiddenError('You do not own this order');
    }
    
    if (role === Role.AGENT) {
      const agentProfile = await prisma.agentProfile.findUnique({ where: { userId } });
      const assignedToAgent = order.deliveryAttempts.some(da => da.agentId === agentProfile?.id);
      if (!assignedToAgent) throw new ForbiddenError('You are not assigned to this order');
    }

    return order;
  }

  static async getTracking(orderId: string, userId: string, role: Role) {
    // Re-use ownership validation
    await this.getOrderById(orderId, userId, role);

    const tracking = await prisma.trackingHistory.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' }
    });

    return tracking;
  }
}
