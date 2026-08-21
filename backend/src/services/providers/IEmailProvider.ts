export interface IEmailProvider {
  send(to: string, subject: string, text: string, html?: string): Promise<boolean>;
}
