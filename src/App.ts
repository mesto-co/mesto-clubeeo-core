import "reflect-metadata";

import {App} from "./BaseApp";
import MestoEnv from "./Env";
import pino from 'pino';
import { Once } from "flambo";
import { EntityManager } from "typeorm";
import { DataSource } from "typeorm";
import { Engines } from "./engines/Engines";
import { AppFactory } from "./engines/AppsEngine/AppsFactory";
import { ExtendedEntityManager } from "./core/lib/ExtendedEntityManager";
import {postEventsFactory, TPostEvents} from './clubApps/PostsApp/postEvents'
import {Emitter} from 'mitt'
import {ClubUserEvents, clubUserEventsFactory} from './events/clubUserEvents'

export class MestoApp extends App {
  readonly clubUserEvents: Emitter<ClubUserEvents>;
  readonly postEvents: Emitter<TPostEvents>;

  constructor() {
    // todo: remove super, use this.env()
    super(new MestoEnv());

    this.clubUserEvents = clubUserEventsFactory();
    this.postEvents = postEventsFactory(this);
  }

  async init() {
    await this.db.initialize();

    for (const engineName of this.engines.enabledEngines) {
      if ('init' in this.engines[engineName]) {
        this.logger.info({engineName}, 'Initializing engine');
        await this.engines[engineName].init();
      }
    }

    this.logger.info('App & engines initialized');
  }

  async run() {
    this.logger.info('Running MestoApp');

    for (const engineName of this.engines.enabledEngines) {
      if ('run' in this.engines[engineName]) {
        this.logger.info({engineName}, 'Running engine');
        await this.engines[engineName].run();
      }
    }

    this.logger.info({engines: this.engines.enabledEngines}, 'Engines run');
  }

  @Once()
  get env() {
    return new MestoEnv();
  }

  @Once()
  get logger(): pino.Logger {
    return pino({
      level: 'info',
      serializers: {
        err: pino.stdSerializers.err
      },
      transport: this.env.nodeEnv === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    });
  }

  @Once()
  get db() {
    return new DataSource(this.dataSourceSettings);
  }

  get dataSourceSettings() {
    return {
      type: this.env.databaseType as 'postgres',
      host: this.env.databaseHost,
      port: this.env.databasePort,
      username: this.env.databaseUser,
      password: this.env.databasePassword,
      database: this.env.databaseName,
      ssl: this.env.databaseSsl,
      synchronize: true,
      entities: [
        __dirname + '/models/*.ts',
        __dirname + '/engines/MotionEngine/models/*.ts',
        __dirname + '/engines/AppsEngine/models/*.ts',
        // 'engines/MemberProfiles/models/*.ts',
        __dirname + '/engines/FileStorageEngine/models/*.ts',
        // ...Object.values(this.engines.apps.models),
        ...Object.values(this.engines.translations.models),
        ...Object.values(this.engines.lists.models),
        ...Object.values(this.engines.memberProfiles.models),
        // ...Object.values(this.engines.motion.models),
        // ...Object.values(this.engines.fileStorage.models),
      ],
    } as any;
  }

  // Quick access to EntityManager
  get m(): EntityManager {
    return this.db.manager;
  }

  // Extended entity manager
  @Once()
  get em() {
    return new ExtendedEntityManager(this.m);
  }

  // i18n
  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    return await this.engines.translations.t(code, lang, values, def)
  }

  @Once()
  get engines() {
    return new Engines(this);
  }

  // aliases
  get Env() {
    return this.env;
  }

  // @ts-ignore
  get ng() {
    return this.engines as any;
  }

  /**
   * @deprecated use `logger` instead; alias for logger
   */
  @Once()
  get log() {
    this.logger.warn('app.log() is deprecated; use app.logger() instead');

    return {
      info: (message, opts) => this.logger.info(opts, message),
      error: (message, opts) => this.logger.error(opts, message),
      warn: (message, opts) => this.logger.warn(opts, message),
      debug: (message, opts) => this.logger.debug(opts, message),
      trace: (message, opts) => this.logger.trace(opts, message),
      fatal: (message, opts) => this.logger.fatal(opts, message),
    }
  }

  // @ts-ignore
  get clubAppFactory() { return this.once('clubAppFactory', () => new AppFactory(this)) }

  // removed

  /**
   * @deprecated use `engines.telegram` instead
   */
  // @ts-ignore
  // get TelegramContainer() {
  //   throw new Error('TelegramContainer is deprecated; use app.engines.telegram instead');
  // }
}

export default MestoApp;