
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

  constructor() {
    this.telegramToken = process.env.TELEGRAM_TOKEN || process.env.TG_TOKEN || '';
    this.telegramApi = process.env.TELEGRAM_API || process.env.TG_API || 'https://api.telegram.org';
  }
}