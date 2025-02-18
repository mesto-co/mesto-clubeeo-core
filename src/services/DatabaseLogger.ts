import {IBricksLoggerOpts, ILoggerLevels, ProtoLogger} from 'bricks-ts-logger'
import App from '../App'
import {Log} from '../models/Log';

export class DatabaseLoggerConsole extends ProtoLogger {
  protected app: App;

  constructor(app: App) {
    super();
    this.app = app;
  }

  async call(level: ILoggerLevels, message: string, opts?: IBricksLoggerOpts) {
    await this.app.m.save(
      this.app.m.create(Log, {
        level,
        message,
        data: opts
      })
    );
  }
}
