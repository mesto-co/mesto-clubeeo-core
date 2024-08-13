
export class TelegramEnv {
  private static instance: TelegramEnv;

  /**
   * Get instance
   */
  public static getInstance(): TelegramEnv {
    if (!TelegramEnv.instance) {
      TelegramEnv.instance = new TelegramEnv();
    }

    return TelegramEnv.instance;
  }

  telegramToken: string;
  telegramApi: string;
  webhookDomain: string;
  telegramMode: string;

  constructor() {
    this.telegramToken = process.env.TELEGRAM_TOKEN || process.env.TG_TOKEN || '';
    this.telegramApi = process.env.TELEGRAM_API || process.env.TG_API || 'https://api.telegram.org';
    this.telegramMode = process.env.TELEGRAM_MODE || 'polling';
    this.webhookDomain = process.env.WEBHOOK_DOMAIN || '';
  }
}