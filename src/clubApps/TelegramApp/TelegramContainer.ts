import App from '../../App';
import {Telegram} from 'telegraf';
import { Env } from '../../env';
import {TelegramBotUpdatesFactory} from './TelegramBotUpdatesFactory'
import {TelegramBotUpdates} from './TelegramBotUpdates'
import telegramHookRoutes from './api/telegramHookRoutes'

export class BaseTelegramContainer {
  readonly Env: Env;

  constructor(env: Env) {
    this.Env = env;
  }

  protected _Telegram: Telegram;
  get Telegram(): Telegram {
    return this._Telegram || (this._Telegram = new Telegram(this.Env.tgToken, {
      webhookReply: true,
      apiRoot: this.Env.tgApi,
    }))
  }
}

export class TelegramContainer extends BaseTelegramContainer{
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

}
