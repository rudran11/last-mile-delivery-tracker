import { PrismaClient, AttemptStatus, OrderStatus } from '@prisma/client';
import { CreateFeedbackInput } from '../validators/feedbackValidators';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../errors/DomainError';

const prisma = new PrismaClient();

export class CustomerFeedbackService {
  /**
   * Retrieves the most recent DELIVERED order for the customer that hasn't been rated yet.
   */
  static async getEligibleFeedbackOrder(customerId: string) {
    const eligibleOrder = await prisma.order.findFirst({
      where: {
        customerId,
        status: OrderStatus.DELIVERED,
        customerFeedback: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return eligibleOrder;
  }

  /**
   * Creates feedback for an order.
   * Derives the agentId strictly from the SUCCESS DeliveryAttempt to prevent spoofing.
   */
  static async createFeedback(customerId: string, data: CreateFeedbackInput) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        customerFeedback: true,
        deliveryAttempts: {
          where: { status: AttemptStatus.SUCCESS },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenError('You can only rate your own orders');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestError('Only delivered orders can be rated');
    }

    if (order.customerFeedback) {
      throw new ConflictError('Feedback has already been submitted for this order');
    }

    const successAttempt = order.deliveryAttempts[0];
    if (!successAttempt) {
      throw new BadRequestError('Cannot determine the agent who delivered this order');
    }

    const feedback = await prisma.customerFeedback.create({
      data: {
        orderId: order.id,
        customerId,
        agentId: successAttempt.agentId,
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });

    return feedback;
  }
}
