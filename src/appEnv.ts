import 'reflect-metadata';

/**
 * Facade for env variables
 */
const path = require('path');
import * as dotenv from 'dotenv';
dotenv.config();

import { Env } from './core/lib/EnvDecorator'
import { CoreEnv } from './core/CoreEnv';

export interface IWorkersConfig {
  motion: boolean,
  legacyTasks: boolean,
  discord: boolean,
}

export interface IGlobalConfig {
  root?: {
    redirect?: string
  }
}

export class AppEnv extends CoreEnv {
  private static instance: AppEnv

  private constructor() {
    super();

    process.env.TZ = 'UTC';

    this.ssr = process.env.SSR === 'true' || this.nodeEnv !== 'development'; // assume development is non-SSR (SPA) by default, other environments are - SSR
    this.siteUrl = String(process.env.SITE_URL || `http://${this.domain}${this.ssr ? '' : '/#'}`);
  }

  /**
   * Get instance
   */
  public static getInstance(): AppEnv {
    if (!AppEnv.instance) {
      AppEnv.instance = new AppEnv()
    }

    return AppEnv.instance
  }

  // test database (postgreSQL) config
  readonly testDatabaseName: string;
  readonly testDatabaseUser: string;
  readonly testDatabasePassword: string;

  @Env(() => /node_modules\/mocha/.test(require.main.filename)
    ? path.dirname(path.dirname(path.dirname(path.dirname(require.main.filename))))
    : path.dirname(path.dirname(require.main.filename))
  )
  readonly rootDir: string;

  readonly ssr: boolean;
  readonly siteUrl: string;

  @Env()
  readonly moralisApiKey: string;

  @Env()
  readonly tgToken: string;

  @Env('https://api.telegram.org')
  readonly tgApi: string;

  @Env()
  readonly tgCallbackRoot: string;

  @Env()
  readonly tgLoginBot: string;

  @Env((self) => `${self.tgCallbackRoot}/api/telegram/hook`)
  readonly tgWebhook: string;

  @Env()
  readonly discordApplicationId: string;

  @Env()
  readonly discordPublicKey: string;

  @Env()
  readonly discordSecret: string;

  @Env()
  readonly discordBotToken: string;

  @Env({default: '{"motion":true,"discord":true,"legacyTasks":false}', type: 'json'})
  readonly workers: IWorkersConfig;

  @Env({default: '{}', type: 'json'})
  readonly globalConfig: IGlobalConfig;

  @Env(500)
  readonly taskProcessingInterval: number;

  @Env('clubeeo')
  readonly defaultClub: string;
}

export const env = AppEnv.getInstance();
