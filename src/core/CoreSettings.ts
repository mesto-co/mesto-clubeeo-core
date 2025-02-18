import { CoreEnv } from "./CoreEnv";

export default class CoreSettings {
  private Env: CoreEnv;

  constructor(deps: {Env: CoreEnv}) {
    this.Env = deps.Env
  }

  get pinoTransport() {
    return this.Env.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined;
  }
}