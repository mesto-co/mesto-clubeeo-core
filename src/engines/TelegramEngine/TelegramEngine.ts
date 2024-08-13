import { EngineBase } from "clubeeo-core";
import { MestoApp } from "../../App";
import { TelegramEnv } from "./TelegramEnv";
import { Telegraf } from "telegraf";

export class TelegramEngine extends EngineBase {
  readonly type = "engine";
  bot: Telegraf;

  constructor(protected c: MestoApp) {
    super();

    this.bot = new Telegraf(this.env.telegramToken);
  }

  async init() {
    this.c.logger.info('Initializing Telegram engine');

    if (this.env.telegramMode === 'webhook') {
      const webhookDomain = this.env.webhookDomain;
      const telegramWebhookPath = `/${this.c.Env.apiPrefix}/engines/telegram/${this.bot.secretPathComponent()}`;
      const webhook = await this.bot.createWebhook({ domain: webhookDomain, path: telegramWebhookPath });
      this.c.router.post(telegramWebhookPath, webhook as any);
    }

    // this.bot.command('start', ctx => ctx.reply(`Welcome! ${JSON.stringify(ctx.message)}`));
    // this.bot.start(ctx => ctx.reply(`Welcome! ${ctx.payload}`));
  }

  async run() {
    this.c.logger.info('Running Telegram engine');

    this.bot.launch();
  }

  get env() { return this.once('env', () => TelegramEnv.getInstance() ) }
}
