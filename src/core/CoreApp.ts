import fastify from 'fastify';

import { ContainerBase } from "./lib/ContainerBase";
import { CoreEnv } from "./CoreEnv";
import { DataSource, EntityManager } from "typeorm";
import { coreWebInit, coreWebRun } from './coreWeb';
import pino from 'pino';

export class CoreApp extends ContainerBase {
  async init() {
    // Initialize database
    await this.db.initialize();

    // Initialize web (fastify)
    coreWebInit(this);
  }

  async run() {
    coreWebRun(this);
  }

  get Env(): CoreEnv { return this.patch('Env', () => new CoreEnv()); }

  // database
  get _dataSourceEntities(): Array<string> {
    return []
  }

  get db(): DataSource {
    return this.patch('db',
      () => new DataSource({
        type: this.Env.databaseType as 'postgres',
        host: this.Env.databaseHost,
        port: this.Env.databasePort,
        username: this.Env.databaseUser,
        password: this.Env.databasePassword,
        database: this.Env.databaseName,
        ssl: this.Env.databaseSsl,
        entities: this._dataSourceEntities,
        synchronize: true,
      })
    );
  }

  // Quick access to EntityManager
  get m(): EntityManager { return this.db.manager }

  // i18n stub
  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    return def || code;
  }

  // web
  get router() { return this.patch('router', () => fastify({trustProxy: 1})) }

  get logger() {
    return this.patch('logger', () => pino({  
      level: this.Env.logLevel,
      serializers: {
          err: pino.stdSerializers.err
      },
      transport: this.Env.nodeEnv === 'development' ? {
          target: 'pino-pretty',
          options: {
            colorize: true
          }
        } : null
      })
    );
  }
}