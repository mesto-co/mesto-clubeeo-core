import {nanoid} from 'nanoid';
import {AppEnv} from './appEnv';
import AuthService from './services/AuthService';
import {IModelHooksService, ModelHooksDummyService} from './services/ModelHooksService';
import {UserManageService} from './services/user/UserManageService';
import AppWeb3 from './services/web3/AppWeb3';
import {AccessService} from './services/AccessService'
import {BricksLoggerConsole, BricksLoggerMultiProxy, IBricksLogger} from 'bricks-ts-logger';
import {DatabaseLoggerConsole} from './services/DatabaseLogger'
import axios from 'axios';
import {MoralisApi} from './services/external/MoralisApi';
import WalletService from './services/WalletService';
import {MeInClubService} from './services/MeInClubService'
import {TokenEvents, tokenEventsFactory} from './events/tokenEvents'
import {Emitter} from 'mitt'
import {ReposContainer} from './models/repos/ReposContainer'
import {ClubUserEvents, clubUserEventsFactory} from './events/clubUserEvents'
import {DataSource} from 'typeorm/data-source/DataSource'
import {WalletAmountFactory} from './services/walletAmount/WalletAmountFactory'
import discord from 'discord.js'
import {TelegramContainer} from './clubApps/TelegramApp/TelegramContainer'
import {DiscordContainer} from './clubApps/DiscordApp/DiscordContainer'
import {Contexts} from './Contexts'
import {UserSenderService} from './services/UserSenderService'
import {postEventsFactory, TPostEvents} from './clubApps/PostsApp/postEvents'
import ExtendedEntityManager from './lib/ExtendedEntityManager'
import {Engines} from './Engines'
import {SimpleFileUploadService} from './services/uploads/SimpleFileUploadService'
import {ClubWidgetFactory} from './factories/ClubWidgetFactory'
import {AppFactory} from './engines/AppEngine/AppFactory'
import { CoreApp } from './core/CoreApp';
import { taskProcessingDaemon } from './daemons/TaskProcessingDaemon/taskProcessingDaemon';
import discordDaemon from './clubApps/DiscordApp/discordDaemon';

export class NoDBContainer extends CoreApp {
  protected env: AppEnv

  public fastify;
  readonly axios = axios;

  get Env(): AppEnv { return this.env || AppEnv.getInstance(); }
  get AppWeb3() { return AppWeb3.getInstance(); }

  get MoralisApi() { return this.patch('MoralisApi', () => new MoralisApi(this)) }
  get consoleLogger(): IBricksLogger { return this.patch('consoleLogger', () => new BricksLoggerConsole()) }
  get log(): IBricksLogger { return this.consoleLogger }
  get nanoid() { return nanoid }
}

/**
 * Application service container
 *
 * Naming:
 * * Exact implementation named as class (e.g. SyncTemplateMailerService)
 * * Interface named in snake case without "Service" suffix  (e.g. templateMailer)
 */
export default class App extends NoDBContainer {
  readonly tokenEvents: Emitter<TokenEvents>;
  readonly clubUserEvents: Emitter<ClubUserEvents>;
  readonly postEvents: Emitter<TPostEvents>;

  constructor(env: AppEnv) {
    super();

    this.env = env;

    this.tokenEvents = tokenEventsFactory(this);
    this.clubUserEvents = clubUserEventsFactory(this);
    this.postEvents = postEventsFactory(this);
  }

  async run() {
    await super.run();

    if (this.Env.workers.legacyTasks) {
      // cron(app);
      taskProcessingDaemon(this);
    }

    if (this.Env.workers.motion) {
      this.engines.motionEngine.runDaemon();
    }

    if (this.Env.workers.discord) {
      discordDaemon(this.DiscordContainer);
    }
  }

  // nested containers
  get contexts() { return this.patch('contexts', () => new Contexts(this)) }
  get engines() { return this.patch('engines', () => new Engines(this)) }
  get repos() { return this.patch('repos', () => new ReposContainer(this)) }

  // database
  get _dataSourceEntities(): Array<string> {
    return [
      __dirname + "/models/*.ts",
      __dirname + "/engines/SubscriptionEngine/models/*.ts",
      __dirname + "/engines/AppEngine/models/*.ts",
      __dirname + "/engines/MotionEngine/models/*.ts",
      __dirname + "/engines/TranslationEngine/models/*.ts",
    ]
  }
  get DB(): DataSource { return this.db }
  get em() { return this.patch('em', () => new ExtendedEntityManager(this.m)) }

  // i18n
  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    return await this.engines.translation.t(code, lang, values, def)
  }

  // services
  get access() { return this.patch('access', () => new AccessService(this)) }
  get auth() { return this.patch('auth', () => new AuthService(this)) }
  get clubAppFactory() { return this.patch('clubAppFactory', () => new AppFactory(this)) }
  get clubWidgetFactory() { return this.patch('clubWidgetFactory', () => new ClubWidgetFactory(this)) }
  get fileUploadService() { return this.patch('fileUploadService', () => new SimpleFileUploadService(this)) }
  get MeInClubService() { return this.patch('MeInClubService', () => new MeInClubService(this)) }
  get modelHooks(): IModelHooksService { return this.patch('modelHooks', () => new ModelHooksDummyService(this)) }
  get UserManageService() { return this.patch('UserManageService', () => new UserManageService(this)) }
  get userSender() { return this.patch('userSender', () => new UserSenderService(this)) }
  get WalletService() { return this.patch('WalletService', () => new WalletService(this)) }
  get walletAmountFactory() { return this.patch('walletAmountFactory', () => new WalletAmountFactory(this)) }

  // logger
  get log(): IBricksLogger {
    return this.patch('log', () => new BricksLoggerMultiProxy(
      this.consoleLogger,
      this.dbLogger,
    ));
  }
  get dbLogger(): IBricksLogger { return this.patch('dbLogger', () => new DatabaseLoggerConsole(this)) }

  // integrations: todo: move to engines
  get Discord(): discord.Client { return this.DiscordContainer.Discord }
  get DiscordContainer() { return this.patch('DiscordContainer', () => new DiscordContainer(this)) }
  get TelegramContainer() { return this.patch('TelegramContainer', () => new TelegramContainer(this)) }
}
