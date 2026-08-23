import { PrismaClient, Channel, NotificationStatus, NotificationEvent } from '@prisma/client';
import { logger } from '../utils/logger';
import { IEmailProvider } from './providers/IEmailProvider';
import { EmailProviderFactory } from './providers/EmailProviderFactory';

const prisma = new PrismaClient();

export class NotificationService {
  private static emailProvider: IEmailProvider = EmailProviderFactory.getProvider();

  static async emit(orderId: string, event: NotificationEvent, idempotencyKey: string, extraData?: any) {
    try {
      // 1. Check Idempotency (prevent duplicate events)
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey }
      });
      
      if (existing) {
        logger.info(`Notification for ${idempotencyKey} already processed. Skipping.`);
        return;
      }

      // 2. Fetch Order Data
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true, pricingSnapshot: true }
      });

      if (!order || !order.customer.email) {
        logger.warn(`Cannot send notification: Order or Customer Email not found for order ${orderId}`);
        return;
      }

      // 3. Create PENDING DB Record safely using unique constraint
      const notification = await prisma.notification.create({
        data: {
          orderId,
          channel: Channel.EMAIL,
          event,
          idempotencyKey,
          status: NotificationStatus.PENDING
        }
      });

      // 4. Format Email
      const { subject, text } = this.formatEmail(event, order, extraData);

      // 5. Send via Provider
      try {
        await this.emailProvider.send(order.customer.email, subject, text);
        
        // Update DB to SENT
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: NotificationStatus.SENT, sentAt: new Date() }
        });
      } catch (error: any) {
        logger.error(`Failed to send notification email for ${idempotencyKey}`, { error: error.message });
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: NotificationStatus.FAILED, failureReason: error.message }
        });
      }

    } catch (error: any) {
      if (error.code === 'P2002') {
        logger.info(`Idempotency conflict for ${idempotencyKey}. Skipping duplicate.`);
      } else {
        logger.error(`Notification emit error for ${idempotencyKey}`, { error: error.message });
      }
    }
  }

  private static formatEmail(event: NotificationEvent, order: any, extraData: any): { subject: string, text: string } {
    const customerName = order.customer.name || 'Customer';
    let subject = `Order Update: ${event}`;
    let text = `Hello ${customerName},\n\n`;

    switch (event) {
      case NotificationEvent.ORDER_CREATED:
        subject = `Order Created — #${order.id}`;
        text += `Your order ${order.id} has been successfully created.\n`;
        text += `Pickup: ${order.pickupAddress}\nDrop: ${order.dropAddress}\n\n`;
        if (order.pricingSnapshot) {
          text += `--- BILLING DETAILS ---\n`;
          text += `Payment Method: ${order.pricingSnapshot.paymentType}\n`;
          text += `Order Type: ${order.pricingSnapshot.orderType}\n`;
          text += `Base Charge: ₹${order.pricingSnapshot.baseCharge}\n`;
          text += `COD Surcharge: ₹${order.pricingSnapshot.paymentType === 'PREPAID' ? 0 : order.pricingSnapshot.appliedCodSurcharge}\n`;
          text += `Final Payable: ₹${order.calculatedCharge}\n`;
          text += `-----------------------\n`;
        }
        break;
      case NotificationEvent.ASSIGNED:
        subject = `Order Assigned — #${order.id}`;
        text += `Your order ${order.id} has been assigned to a delivery agent.\n`;
        break;
      case NotificationEvent.PICKED_UP:
        subject = `Order Picked Up — #${order.id}`;
        text += `Your shipment for order ${order.id} has been picked up.\n`;
        break;
      case NotificationEvent.IN_TRANSIT:
        subject = `Order In Transit — #${order.id}`;
        text += `Your shipment for order ${order.id} is moving through the delivery lifecycle.\n`;
        break;
      case NotificationEvent.OUT_FOR_DELIVERY:
        subject = `Order Out For Delivery — #${order.id}`;
        text += `Your delivery for order ${order.id} is currently out for delivery.\n`;
        break;
      case NotificationEvent.DELIVERED:
        subject = `Order Delivered — #${order.id}`;
        text += `Your order ${order.id} has been successfully delivered!\n`;
        break;
      case NotificationEvent.FAILED:
        subject = `Delivery Failed — #${order.id}`;
        text += `We failed to deliver your order ${order.id}.\n`;
        if (extraData?.failureReason) {
          text += `Reason: ${extraData.failureReason}\n`;
        }
        text += `Please log in to your account to reschedule the delivery.\n`;
        break;
      case NotificationEvent.RESCHEDULED:
        subject = `Order Rescheduled — #${order.id}`;
        text += `Your order ${order.id} has been successfully rescheduled.\n`;
        if (extraData?.scheduledDate) {
          text += `New Scheduled Date: ${new Date(extraData.scheduledDate).toLocaleDateString()}\n`;
        }
        text += `Current status: ${order.status}\n`;
        break;
      case NotificationEvent.ADMIN_STATUS_OVERRIDE:
        subject = `Admin Status Override — #${order.id}`;
        text += `An administrator has manually updated the status of order ${order.id} to ${order.status}.\n`;
        break;
      default:
        text += `Your order ${order.id} status is now: ${event}.\n`;
    }

    text += `\nThank you for choosing Unthinkable Delivery!`;
    return { subject, text };
  }
}
