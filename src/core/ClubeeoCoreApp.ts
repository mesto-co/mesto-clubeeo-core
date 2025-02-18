import { EntityTarget } from 'typeorm';
import { ContainerBase } from "./lib/ContainerBase";
import { CoreEnv } from "./CoreEnv";
import { DataSource, EntityManager } from "typeorm";
import { coreWebRun } from './coreWeb';
import pino from 'pino';
import { coreRouterFactory } from './coreRouter';
import ExtendedEntityManager from './lib/ExtendedEntityManager';
import AuthService from './services/AuthService';
import CoreSettings from "./CoreSettings";
import { IUserModel } from "./domains/user/UserInterfaces";
import { IUserExtModel } from "./domains/userExt/UserExtInterfaces";
import { ExePureCore } from "../lib/ExePureCore";
import UserDomain from './domains/user/UserDomain';
import UserExtDomain from './domains/user/UserDomain';

export type TCoreApp = ClubeeoCoreApp<IUserModel, IUserExtModel<IUserModel>, ExePureCore.IMember, ExePureCore.IHub>;

export default abstract class ClubeeoCoreApp<
  TUser extends IUserModel,
  TUserExt extends IUserExtModel<TUser>,
  TMember extends ExePureCore.IMember,
  TClub extends ExePureCore.IHub,
> extends ContainerBase implements ExePureCore.IAppContainer<TMember, TUser, TClub> {

  constructor(readonly models: {
    User: EntityTarget<TUser>,
    UserExt: EntityTarget<TUserExt>,
    Member: EntityTarget<TMember>,
    Club: EntityTarget<TClub>,
  }) {
    super();
  }

  async init() {
    // Initialize database
    await this.db.initialize();
  }

  /**
   * @deprecated replace domains with engines
   */
  domains = {
    user: new UserDomain(this, this.models.User),
    userExt: new UserExtDomain(this, this.models.User),
  }

  abstract engines: ExePureCore.IEngines<TMember, TUser, TClub>;
  // alias
  get ng() { return this.engines }

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

  // alias
  get env() { return this.Env }

  /**
   * Application settings
   */
  get Settings() { return this.once('Settings', () => new CoreSettings(this)) }

  get db() { return this.once('db', () => new DataSource(this.dataSourceSettings)) }

  // Quick access to EntityManager
  get m(): EntityManager { return this.db.manager }

  // Extended entity manager
  get em() { return this.once('em', () => new ExtendedEntityManager(this.m)) }

  // i18n
  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    return await this.ng.translations.t(code, lang, values, def)
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

  // settings

  get dataSourceSettings() {
    return {
      type: this.Env.databaseType as 'postgres',
      host: this.Env.databaseHost,
      port: this.Env.databasePort,
      username: this.Env.databaseUser,
      password: this.Env.databasePassword,
      database: this.Env.databaseName,
      ssl: this.Env.databaseSsl,
      entities: [],
      synchronize: true,
    }
  }
}
