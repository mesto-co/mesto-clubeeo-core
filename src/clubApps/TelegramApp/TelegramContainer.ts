import App from '../../App';
import {Telegram} from 'telegraf';
import {AppEnv} from '../../appEnv';
import {TelegramBotUpdatesFactory} from './TelegramBotUpdatesFactory'
import {TelegramBotUpdates} from './TelegramBotUpdates'
import telegramHookRoutes from './api/telegramHookRoutes'
import TgAppInitData from './lib/TgAppInitData'
import {Message} from 'typegram/message'
import {tgUserContextByMessage} from './lib/TgUserContext'
import { TelegramEnv } from './TelegramEnv';

export class BaseTelegramContainer {
  readonly Env: AppEnv;
  readonly tgEnv: TelegramEnv;

  constructor(env: AppEnv, tgEnv?: TelegramEnv) {
    this.Env = env;
    this.tgEnv = tgEnv || TelegramEnv.getInstance();
  }

  protected _Telegram: Telegram;
  get Telegram(): Telegram {
    return this._Telegram || (this._Telegram = new Telegram(this.tgEnv.telegramToken, {
      webhookReply: true,
      apiRoot: this.Env.tgApi,
    }))
  }

  tgAppInitData(initData: string): TgAppInitData {
    return new TgAppInitData(initData, this.tgEnv.telegramToken);
  }
}

export class TelegramContainer extends BaseTelegramContainer {
  readonly app: App;

  constructor(app: App) {
    super(app.Env);
    this.app = app;
  }

  protected _TelegramBotUpdates: TelegramBotUpdates;
  get TelegramBotUpdates(): TelegramBotUpdates {
    return this._TelegramBotUpdates || (this._TelegramBotUpdates = (new TelegramBotUpdatesFactory(this)).build());
  }

  get telegramHookRoutes() {
    return telegramHookRoutes({TelegramBotUpdates: this.TelegramBotUpdates});
  }

  async tgUserContextByMessage(message: Message) {
    return await tgUserContextByMessage(this.app, message);
  }
}
