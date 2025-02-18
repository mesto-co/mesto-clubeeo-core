import 'reflect-metadata';

import * as dotenv from 'dotenv';
dotenv.config();


/**
 * Facade for env variables
 */

import {PrimaryGeneratedColumnNumericOptions} from 'typeorm/decorator/options/PrimaryGeneratedColumnNumericOptions'
import {Env} from './lib/EnvDecorator'

type TNodeEnv = "development" | "production" | "test";

export class CoreEnv {
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

  // bash$ npx fastify-secure-session | base64
  @Env()
  readonly appSecret: string;

  @Env('session')
  readonly sessionCookieName: string;

  @Env({default: 14*24*60*60, key: 'SESSION_COOKIE_TTL'})
  readonly sessionCookieTTL: number;

  @Env('localhost:9999')
  readonly domain: string;

  @Env('en')
  readonly defaultLang: string;

  @Env('info')
  readonly logLevel: string;
}
