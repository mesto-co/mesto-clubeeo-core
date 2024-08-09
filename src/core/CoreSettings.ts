import { CoreEnv } from "./CoreEnv";

export default class CoreSettings {
  private Env: CoreEnv;

  constructor(deps: {Env: CoreEnv}) {
    this.Env = deps.Env
  }

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

  get pinoTransport() {
    return this.Env.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined;
  }
}