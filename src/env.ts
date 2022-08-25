/**
 * Env variables wrapper
 */
const path = require('path');

type TNodeEnv = "development" | "production" | "test";

export class Env {
  private static instance: Env

  /**
   * Get instance
   */
  public static getInstance(): Env {
    if (!Env.instance) {
      Env.instance = new Env()
    }

    return Env.instance
  }

  // environment: "development" | "production" | "test"
  readonly nodeEnv: TNodeEnv;

  // application instance identifier
  readonly instanceId: string;

  // http config
  readonly port: number;
  readonly host: string;
  readonly apiPrefix: string;

  // database (postgreSQL) config
  readonly databaseName: string;
  readonly databaseUser: string;
  readonly databasePassword: string;
  readonly databaseHost: string;
  readonly databasePort: number;

  // test database (postgreSQL) config
  readonly testDatabaseName: string;
  readonly testDatabaseUser: string;
  readonly testDatabasePassword: string;

  readonly appSecret: string;
  readonly rootDir: string;
  readonly sessionCookieName: string;
  readonly sessionCookieTTL: number;
  readonly domain: string;
  readonly ssr: boolean;
  readonly siteUrl: string;

  readonly moralisApiKey: string;

  readonly tgToken: string;
  readonly tgApi: string;
  readonly tgCallbackRoot: string;
  readonly tgWebhook: string;
  readonly tgLoginBot: string;

  readonly runWorker: string;

  readonly discordApplicationId: string;
  readonly discordPublicKey: string;
  readonly discordSecret: string;
  readonly discordBotToken: string;

  /**
   * Don't call directly
   */
  private constructor() {
    this.nodeEnv = (process.env.NODE_ENV || "development") as TNodeEnv;
    this.instanceId = process.env.INSTANCE_ID || "local";
    this.port = Number(process.env.PORT || 9900);
    this.host = String(process.env.HOST || "localhost");
    this.apiPrefix = String(process.env.API_PREFIX || "api");
    this.databaseName = String(process.env.DATABASE_NAME || "clubeeo");
    this.databaseUser = String(process.env.DATABASE_USER || "postgres");
    this.databasePassword = String(process.env.DATABASE_PASSWORD || "postgres");
    this.databaseHost = String(process.env.DATABASE_HOST || "localhost");
    this.databasePort = Number(process.env.DATABASE_PORT || 5432);

    // bash$ npx fastify-secure-session | base64
    this.appSecret = String(process.env.APP_SECRET || "=");
    this.sessionCookieName = String(process.env.SESSION_COOKIE_NAME || "session");
    this.sessionCookieTTL = Number(process.env.SESSION_COOKIE_TTL || 14*24*60*60); // default=14 days

    this.domain = String(process.env.DOMIAN || 'localhost:9999');
    this.ssr = process.env.SSR === 'true' || this.nodeEnv !== 'development'; // assume development is non-SSR (SPA) by default, other environments are - SSR
    this.siteUrl = String(process.env.SITE_URL || `http://${this.domain}${this.ssr ? '' : '/#'}`);

    this.rootDir = path.dirname(path.dirname(require.main.filename));
    if (/node_modules\/mocha/.test(require.main.filename)) {
      // testing env, skip for production & development
      this.rootDir = path.dirname(path.dirname(this.rootDir));
    }

    this.moralisApiKey = String(process.env.MORALIS_API_KEY || '');

    this.tgToken = String(process.env.TG_TOKEN || "");
    this.tgApi = String(process.env.TG_API || "https://api.telegram.org");
    this.tgCallbackRoot = String(process.env.TG_CALLBACK_ROOT || this.domain);
    this.tgWebhook = String(process.env.TG_WEBHOOK || `${this.tgCallbackRoot}/api/telegram/hook`);
    this.tgLoginBot = String(process.env.TG_LOGIN_BOT || '');

    this.runWorker = String(process.env.RUN_WORKER || '');

    this.discordApplicationId = String(process.env.DISCORD_APPLICATION_ID || '');
    this.discordPublicKey = String(process.env.DISCORD_PUBLIC_KEY || '');
    this.discordSecret = String(process.env.DISCORD_SECRET || '');
    this.discordBotToken = String(process.env.DISCORD_BOT_TOKEN || '');
  }
}
