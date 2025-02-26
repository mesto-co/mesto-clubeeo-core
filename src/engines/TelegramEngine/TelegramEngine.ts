import { EngineBase } from "../../core/lib/EngineBase";
import { MestoApp } from "../../App";
import { TelegramEnv } from "./TelegramEnv";
import { Telegraf } from "telegraf";
import { telegramApi } from "./telegramApi";
import telegramFileApi from "./telegramFileApi";
import { TelegramFileService } from './services/TelegramFileService';
import { CachedTelegramFileService } from './services/CachedTelegramFileService';
import { ITelegramFileService } from './services/ITelegramFileService';
import { botStart } from "./bot/botStart";
import { botGate } from "./bot/botGate";
import { getTelegramGraphQL } from './graphql';

export class TelegramEngine extends EngineBase {
  readonly type = "engine";
  bot: Telegraf;
  fileService: ITelegramFileService;

  constructor(public c: MestoApp) {
    super();

    this.bot = new Telegraf(this.env.telegramToken);
    
    const telegramFileService = new TelegramFileService(c, this);
    this.fileService = new CachedTelegramFileService(telegramFileService);

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

    botStart(this);
    botGate(this);
  }

  async run() {
    this.c.logger.info('Running Telegram engine');

    this.bot.launch();
  }

  get mainApi() { return telegramApi(this.c) }
  get fileApi() { return telegramFileApi(this.c, this) }
  get api() {
    return (router, opts, done) => {
      router.register(this.mainApi);
      router.register(this.fileApi);
      done();
    }
  }
  apiConfig = {prefix: '/telegram'}

  get env() { return this.once('env', () => TelegramEnv.getInstance() ) }

  get graphql() {
    return getTelegramGraphQL(this);
  }
}
