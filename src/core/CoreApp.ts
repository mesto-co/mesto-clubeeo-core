import { EntityTarget } from 'typeorm';
import { ContainerBase } from "./lib/ContainerBase";
import { CoreEnv } from "./CoreEnv";
import { DataSource, EntityManager } from "typeorm";
import { coreWebRun } from './coreWeb';
import pino from 'pino';
import { Once } from './lib/OnceDecorator';
import { coreRouterFactory } from './coreRouter';
import ExtendedEntityManager from '../core/lib/ExtendedEntityManager';
import AuthService from './services/AuthService';
import CoreDomains from "./CoreDomains";
import CoreSettings from "./CoreSettings";
import { IUserModel } from "./domains/user/UserInterfaces";
import { IUserExtModel } from "./domains/userExt/UserExtInterfaces";

export type TCoreApp = CoreApp<IUserModel, IUserExtModel<IUserModel>>;

export default class CoreApp<
  TUser extends IUserModel,
  TUserExt extends IUserExtModel<TUser>
> extends ContainerBase {

  constructor(protected models: {
    User: EntityTarget<TUser>,
    UserExt: EntityTarget<TUserExt>
  }) {
    super();
  }

  async init() {
    // Initialize database
    await this.db.initialize();
  }

  get domains() { return this.once('domains', () => new CoreDomains(this, this.models)) }

  /**
   * Run the application
   */
  async run() {
    coreWebRun(this as TCoreApp);
  }

  /**
   * Environment variables reader
   */
  get Env() { return this.once('Env', () => new CoreEnv()) }

  /**
   * Application settings
   */
  get Settings() { return this.once('Settings', () => new CoreSettings(this)) }

  get db() { return this.once('db', () => new DataSource(this.Settings.dataSourceSettings)) }


  // Quick access to EntityManager
  get m(): EntityManager { return this.db.manager }

  // Extended entity manager
  get em() { return this.once('em', () => new ExtendedEntityManager(this.m)) }

  // i18n stub
  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    return def || code;
  }

  // web
  get router() { return this.once('router', () => coreRouterFactory(this as TCoreApp)) }

  get logger(): pino.Logger { return this.once('logger', () => pino({
    level: 'info',
    serializers: {
      err: pino.stdSerializers.err
    },
    transport: this.Settings.pinoTransport,
  }))}

  // services

  get auth() { return this.once('auth', () => new AuthService(this as TCoreApp)) }

}
