import { IEmailProvider } from './IEmailProvider';
import { ResendEmailProvider } from './ResendEmailProvider';
import { MockEmailProvider } from './MockEmailProvider';

export class EmailProviderFactory {
  public static getProvider(): IEmailProvider {
    // Determine provider based on environment variables
    if (process.env.NODE_ENV === 'production') {
      return new ResendEmailProvider(); // Never use mock in production
    }

    if (process.env.NODE_ENV === 'test' || process.env.USE_MOCK_EMAIL === 'true') {
      return MockEmailProvider.getInstance();
    }
    
    return new ResendEmailProvider();
  }
}
