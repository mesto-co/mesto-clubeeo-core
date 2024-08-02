import { ContainerBase } from "./lib/ContainerBase";
import { CoreEnv } from "./CoreEnv";
import { DataSource, EntityManager } from "typeorm";
import { coreWebRun } from './coreWeb';
import pino from 'pino';
import { Once } from './lib/OnceDecorator';
import { coreRouterFactory } from './coreRouter';
import ExtendedEntityManager from '../core/lib/ExtendedEntityManager';
import AuthService from './services/AuthService';

export class CoreApp extends ContainerBase {
  async init() {
    // Initialize database
    await this.db.initialize();

    // Initialize web (fastify)
    // coreWebInit(this);
  }

  async run() {
    coreWebRun(this);
  }

  @Once(() => new CoreEnv())
  Env: CoreEnv;

  // database
  get _dataSourceEntities(): Array<string> {
    return []
  }

  @Once((self: CoreApp) => new DataSource({
    type: self.Env.databaseType as 'postgres',
    host: self.Env.databaseHost,
    port: self.Env.databasePort,
    username: self.Env.databaseUser,
    password: self.Env.databasePassword,
    database: self.Env.databaseName,
    ssl: self.Env.databaseSsl,
    entities: self._dataSourceEntities,
    synchronize: true,
  }))
  db!: DataSource;

  // Quick access to EntityManager
  get m(): EntityManager { return this.db.manager }

  // Extended entity manager
  @Once((self: CoreApp) => new ExtendedEntityManager(self.m))
  em: ExtendedEntityManager;

  // i18n stub
  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    return def || code;
  }

  // web
  // get router() { return this.once('router', () => fastify({trustProxy: 1})) }
  get router() { return this.once('router', () => coreRouterFactory(this)) }

  @Once((self: CoreApp) => pino({
    level: 'info',
    serializers: {
      err: pino.stdSerializers.err
    },
    transport: self.Env.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : { target: 'pino' }
  }))
  logger: pino.Logger;

  // services

  @Once((self: CoreApp) => new AuthService(self))
  auth: AuthService;
}