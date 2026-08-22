import nodemailer from 'nodemailer';
import { IEmailProvider } from './IEmailProvider';
import { logger } from '../../utils/logger';

export class EtherealProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter | null = null;
  private isDevelopment = true;

  private async getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass && host !== 'smtp.ethereal.email') {
      this.isDevelopment = false;
      this.transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
      logger.info('Production SMTP transport created.');
    } else {
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

  async send(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const fromName = process.env.SMTP_FROM_NAME || 'DeliveryTracker';
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@deliverytracker.com';
      const fromString = process.env.SMTP_FROM || `"${fromName}" <${fromEmail}>`;

      const message = {
        from: fromString,
        to,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(message);

      if (this.isDevelopment) {
        logger.info(`DEV EMAIL SENT. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      } else {
        logger.info(`PROD EMAIL SENT to ${to}`);
      }
      return true;
    } catch (error: any) {
      logger.error('EmailProvider failed to send', { error: error.message });
      throw error;
    }
  }
}
