import { EngineBase } from "clubeeo-core";
import { MestoApp } from "../../App";
import { TelegramEnv } from "./TelegramEnv";
import { Telegraf } from "telegraf";
import { telegramApi } from "./telegramApi";

export class TelegramEngine extends EngineBase {
  readonly type = "engine";
  bot: Telegraf;

  constructor(protected c: MestoApp) {
    super();

    this.bot = new Telegraf(this.env.telegramToken);

    // this.bot.use(async (ctx, next) => {
    //   ctx['c'] = this.c;
    //   next();
    // });
  }

  async init() {
    if (this.env.telegramMode === 'webhook') {
      const webhookDomain = this.env.webhookDomain;
      const telegramWebhookPath = `/${this.c.Env.apiPrefix}/engines/telegram/${this.bot.secretPathComponent()}`;
      const webhook = await this.bot.createWebhook({ domain: webhookDomain, path: telegramWebhookPath });
      this.c.router.post(telegramWebhookPath, webhook as any);
    }
  }

  async run() {
    this.c.logger.info('Running Telegram engine');

    this.bot.launch();
  }

  get api() { return telegramApi(this.c) }
  apiConfig = {prefix: '/telegram'}

  get env() { return this.once('env', () => TelegramEnv.getInstance() ) }

}
