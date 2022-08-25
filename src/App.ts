import {nanoid} from 'nanoid';
import {Connection, EntityManager} from 'typeorm/index';
import {Env} from './env';
import AuthService from './services/AuthService';
import {IModelHooksService, ModelHooksDummyService} from './services/ModelHooksService';
import { UserManageService } from './services/user/UserManageService';
import AppWeb3 from './services/web3/AppWeb3';
import {BricksLoggerConsole, BricksLoggerMultiProxy, IBricksLogger} from 'bricks-ts-logger';
import {DatabaseLoggerConsole} from './services/DatabaseLogger'
import axios from 'axios';
import { MoralisApi } from './services/external/MoralisApi';
import WalletService from './services/WalletService';
import {MeInClubService} from './services/MeInClubService'
import {UserRepo} from './services/user/UserRepo'
import {ClubRepo} from './services/user/ClubRepo'
import {TokenEvents, tokenEventsFactory} from './events/tokenEvents'
import {Emitter} from 'mitt'
import {ReposContainer} from './models/repos/ReposContainer'
import {ClubUserEvents, clubUserEventsFactory} from './events/clubUserEvents'
import UserInClubContext from './contexts/UserInClubContext'
import User from './models/User'
import Club from './models/Club'
import {ClubContext} from './contexts/ClubContext'
import {UserContext} from './contexts/UserContext'
import {DataSource} from 'typeorm/data-source/DataSource'
import {AuthContext, IAuthContextRequest} from './contexts/AuthContext'
import {WalletAmountFactory} from './services/walletAmount/WalletAmountFactory'
import {IWalletAmountAdapterFactory} from './services/walletAmount/walletAmountInterfaces'
import {chainContextFactory} from './contexts/ChainContext'
import {TChains} from './lib/TChains'
import discord, {Intents} from 'discord.js'
import {TelegramContainer} from './clubApps/TelegramApp/TelegramContainer'
import {DiscordContainer} from './clubApps/DiscordApp/DiscordContainer'
import {Contexts} from './Contexts'
import {ClubAppFactory} from './factories/ClubAppFactory'
import {UserSenderService} from './services/UserSenderService'
import ExtendedEntityManager from './lib/ExtendedEntityManager'
import {Engines} from './Engines'

export class NoDBContainer {
  protected env: Env

  get Env(): Env {
    return this.env || Env.getInstance();
  }

  get AppWeb3() {
    return AppWeb3.getInstance();
  }

  protected _consoleLogger: IBricksLogger;
  get consoleLogger(): IBricksLogger {
    return this._consoleLogger || (this._consoleLogger = new BricksLoggerConsole());
  }

  protected _log: IBricksLogger;
  get log(): IBricksLogger {
    return this.consoleLogger;
  }
}

/**
 * Application service container
 *
 * Naming:
 * * Exact implementation named as class (e.g. SyncTemplateMailerService)
 * * Interface named in snake case without "Service" suffix  (e.g. templateMailer)
 */
export default class App extends NoDBContainer {
  protected db: Connection

  public fastify;
  readonly axios = axios;
  readonly tokenEvents: Emitter<TokenEvents>;
  readonly clubUserEvents: Emitter<ClubUserEvents>;

  constructor(db: DataSource, env: Env) {
    super();

    this.env = env;
    this.db = db;

    this.tokenEvents = tokenEventsFactory(this);
    this.clubUserEvents = clubUserEventsFactory(this);
  }

  get DB(): DataSource {
    return this.db;
  }

  get m(): EntityManager {
    return this.db.manager;
  }

  protected _em: ExtendedEntityManager;
  get em(): ExtendedEntityManager {
    return this._em || (this._em = new ExtendedEntityManager(this.m));
  }

  protected _AuthService: AuthService;

  get auth(): AuthService {
    return this._AuthService || (this._AuthService = new AuthService(this));
  }

  get nanoid() {
    return nanoid;
  }

  protected _modelHooks: IModelHooksService;
  get modelHooks(): IModelHooksService {
    return this._modelHooks || (this._modelHooks = new ModelHooksDummyService(this));
  }

  protected _UserManageService: UserManageService;
  get UserManageService(): UserManageService {
    return this._UserManageService || (this._UserManageService = new UserManageService(this));
  }

  get log(): IBricksLogger {
    return this._log || (this._log =
        new BricksLoggerMultiProxy(
          this.consoleLogger,
          this.dbLogger,
        )
    );
  }

  protected _dbLogger: IBricksLogger;
  get dbLogger(): IBricksLogger {
    return this._dbLogger || (this._dbLogger = new DatabaseLoggerConsole(this));
  }

  protected _UserRepo: UserRepo;
  get UserRepo() {
    return this._UserRepo || (this._UserRepo = new UserRepo(this));
  }

  protected _ClubRepo: ClubRepo;
  get ClubRepo() {
    return this._ClubRepo || (this._ClubRepo = new ClubRepo(this));
  }

  protected _MeInClubService: MeInClubService;
  get MeInClubService() {
    return this._MeInClubService || (this._MeInClubService = new MeInClubService(this));
  }

  protected _WalletService: WalletService;
  get WalletService(): WalletService {
    return this._WalletService || (this._WalletService = new WalletService(this));
  }

  protected _MoralisApi: MoralisApi;
  get MoralisApi() {
    return this._MoralisApi || (this._MoralisApi = new MoralisApi(this));
  }

  protected _repos: ReposContainer;
  get repos() {
    return this._repos || (this._repos = new ReposContainer(this));
  }

  protected _walletAmountFactory: IWalletAmountAdapterFactory;
  get walletAmountFactory(): IWalletAmountAdapterFactory {
    return this._walletAmountFactory || (this._walletAmountFactory = new WalletAmountFactory(this));
  }

  get Discord(): discord.Client {
    return this.DiscordContainer.Discord;
  }

  protected _DiscordContainer: DiscordContainer;
  get DiscordContainer(): DiscordContainer {
    return this._DiscordContainer || (this._DiscordContainer = new DiscordContainer(this));
  }

  protected _TelegramContainer: TelegramContainer;
  get TelegramContainer(): TelegramContainer {
    return this._TelegramContainer || (this._TelegramContainer = new TelegramContainer(this));
  }

  protected _Contexts: Contexts;
  get contexts(): Contexts {
    return this._Contexts || (this._Contexts = new Contexts(this));
  }

  protected _Engines: Engines;
  get engines(): Engines {
    return this._Engines || (this._Engines = new Engines(this));
  }

  protected _ClubAppFactory: ClubAppFactory;
  get clubAppFactory(): ClubAppFactory {
    return this._ClubAppFactory || (this._ClubAppFactory = new ClubAppFactory(this));
  }

  protected _UserSenderService: UserSenderService;
  get userSender(): UserSenderService {
    return this._UserSenderService || (this._UserSenderService = new UserSenderService(this));
  }
}
