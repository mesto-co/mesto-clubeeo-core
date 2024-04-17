import 'reflect-metadata';

/**
 * Env variables wrapper
 */
const path = require('path');
import * as dotenv from 'dotenv';
dotenv.config();

import {PrimaryGeneratedColumnNumericOptions} from 'typeorm/decorator/options/PrimaryGeneratedColumnNumericOptions' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

const envCase = str => {
  return str.split('').map((letter, idx) => {
    return letter.toUpperCase() === letter
      ? `${idx !== 0 ? '_' : ''}${letter.toUpperCase()}`
      : letter.toUpperCase();
  }).join('');
}

interface IEnvConfig {
  type?: StringConstructor | NumberConstructor | BooleanConstructor | 'json',
  default?: IEnvDefault,
  key?: string,
}

type IEnvDefault = string | number | ((target: any) => string | number);

function Env(config?: IEnvDefault | IEnvConfig) {
  const conf: IEnvConfig = (config instanceof Object && !(config instanceof Function)) ? config as IEnvConfig : { default: config };
  const defaultValue = conf.default;

  return function (target: any, propertyKey: string) {
    const envKey = conf.key || envCase(propertyKey);
    let value: any = process.env[envKey] || (defaultValue instanceof Function ? defaultValue(target) : defaultValue);

    const propertyType = conf.type || Reflect.getMetadata('design:type', target, propertyKey);
    if (propertyType === 'json') {
      value = JSON.parse(value)
    } else if (propertyType?.name === 'String') {
      value = String(value);
    } else if (propertyType?.name === 'Number') {
      value = Number(value)
    } else if (propertyType?.name === 'Boolean') {
      value = Boolean(value)
    }

    Object.defineProperty(target, propertyKey, {
      get: function () {
        return value;
      },
      enumerable: true,
      configurable: true
    });
  }
}

type TNodeEnv = "development" | "production" | "test";

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

export class AppEnv {
  private static instance: AppEnv

  /**
   * Get instance
   */
  public static getInstance(): AppEnv {
    if (!AppEnv.instance) {
      AppEnv.instance = new AppEnv()
    }

    return AppEnv.instance
  }

  // environment: "development" | "production" | "test"
  @Env('development')
  readonly nodeEnv: TNodeEnv;

  // application instance identifier
  @Env('local')
  readonly instanceId: string

  // http config
  @Env(9900)
  readonly port: number;

  @Env('localhost')
  readonly host: string;

  @Env('api')
  readonly apiPrefix: string;

  @Env('postgres')
  readonly databaseType: string;

  // database (postgreSQL) config
  @Env('clubeeo')
  readonly databaseName: string;

  @Env('postgres')
  readonly databaseUser: string;

  @Env('postgres')
  readonly databasePassword: string;

  @Env('localhost')
  readonly databaseHost: string;

  @Env(5432)
  readonly databasePort: number;

  @Env()
  readonly databaseSsl: boolean;

  @Env('increment')
  readonly databasePkStrategy: 'increment';

  @Env({default: '{"type":"bigint"}', type: 'json'})
  readonly databasePkOptions: PrimaryGeneratedColumnNumericOptions

  // test database (postgreSQL) config
  readonly testDatabaseName: string;
  readonly testDatabaseUser: string;
  readonly testDatabasePassword: string;

  // bash$ npx fastify-secure-session | base64
  @Env()
  readonly appSecret: string;

  @Env('session')
  readonly sessionCookieName: string;

  @Env({default: 14*24*60*60, key: 'SESSION_COOKIE_TTL'})
  readonly sessionCookieTTL: number;

  @Env(() => /node_modules\/mocha/.test(require.main.filename)
    ? path.dirname(path.dirname(path.dirname(path.dirname(require.main.filename))))
    : path.dirname(path.dirname(require.main.filename))
  )
  readonly rootDir: string;

  @Env('localhost:9999')
  readonly domain: string;

  readonly ssr: boolean;
  readonly siteUrl: string;
  readonly srcPath: string;

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

  /**
   * Don't call directly
   */
  private constructor() {
    this.ssr = process.env.SSR === 'true' || this.nodeEnv !== 'development'; // assume development is non-SSR (SPA) by default, other environments are - SSR
    this.siteUrl = String(process.env.SITE_URL || `http://${this.domain}${this.ssr ? '' : '/#'}`);
  }
}

export const env = AppEnv.getInstance();
