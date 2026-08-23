import { IEmailProvider } from './IEmailProvider';
import { logger } from '../../utils/logger';

export interface SentEmail {
  to: string;
  subject: string;
  text: string;
  html?: string | undefined;
}

export class MockEmailProvider implements IEmailProvider {
  private static instance: MockEmailProvider;
  public sentEmails: SentEmail[] = [];

  private constructor() {}

  public static getInstance(): MockEmailProvider {
    if (!MockEmailProvider.instance) {
      MockEmailProvider.instance = new MockEmailProvider();
    }
    return MockEmailProvider.instance;
  }

  async send(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    this.sentEmails.push({ to, subject, text, html });
    logger.info(`[MOCK EMAIL] Captured email to ${to} with subject "${subject}"`);
    return true;
  }

  public clear(): void {
    this.sentEmails = [];
  }
}
