import { PrismaClient, OrderStatus, Channel, NotificationStatus } from '@prisma/client';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class NotificationService {
  private static transporter: nodemailer.Transporter | null = null;

  private static async getTransporter() {
    if (this.transporter) return this.transporter;

    // Use Ethereal (Dev) or Real SMTP if env vars are present
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
    } else {
      // Development mode fallback using Ethereal
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info('Ethereal Email development transport created.');
    }
    return this.transporter;
  }

  static async sendNotification(orderId: string, event: OrderStatus) {
    // 1. Log to Database first
    const notification = await prisma.notification.create({
      data: {
        orderId,
        channel: Channel.EMAIL,
        event,
        status: NotificationStatus.PENDING
      }
    });

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order || !order.customer.email) {
        throw new Error('Order or Customer Email not found');
      }

      const transporter = await this.getTransporter();

      const message = {
        from: '"Unthinkable Delivery" <noreply@unthinkable.co>',
        to: order.customer.email,
        subject: `Order Update: ${event}`,
        text: `Hello ${order.customer.name},\n\nYour order ${order.id} status is now: ${event}.\n\nThank you for choosing us!`,
      };

      const info = await transporter.sendMail(message);
      
      // Clearly log development email vs production email
      if ((transporter.options as any).host === 'smtp.ethereal.email') {
        logger.info(`DEV EMAIL SENT. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      } else {
        logger.info(`PROD EMAIL SENT to ${order.customer.email}`);
      }

      // Update DB
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT, sentAt: new Date() }
      });

    } catch (error: any) {
      logger.error('Failed to send notification', { error: error.message });
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED, failureReason: error.message }
      });
    }
  }
}
