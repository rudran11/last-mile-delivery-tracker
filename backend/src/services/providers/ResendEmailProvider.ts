import { Resend } from 'resend';
import { IEmailProvider } from './IEmailProvider';
import { logger } from '../../utils/logger';

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn('RESEND_API_KEY is not configured. Emails will fail to send.');
    }
    // Initialize with dummy key if missing, so we can throw later safely
    this.resend = new Resend(apiKey || 'missing_key');
  }

  async send(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      const fromName = process.env.RESEND_FROM_NAME || 'DeliveryTracker';
      const fromEmail = process.env.RESEND_FROM_EMAIL;

      if (!fromEmail) {
        throw new Error('RESEND_FROM_EMAIL is not configured');
      }

      const from = `"${fromName}" <${fromEmail}>`;

      const payload: any = {
        from,
        to,
        subject,
        text,
      };

      if (html) {
        payload.html = html;
      }

      const response = await this.resend.emails.send(payload);

      if (response.error) {
        logger.error('Resend failed to send email', { error: response.error.message });
        throw new Error(response.error.message);
      }

      logger.info(`RESEND EMAIL SENT to ${to} (ID: ${response.data?.id})`);
      return true;
    } catch (error: any) {
      logger.error('ResendEmailProvider failed', { error: error.message });
      throw error;
    }
  }
}
