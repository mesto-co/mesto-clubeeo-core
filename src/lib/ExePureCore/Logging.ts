/**
 * Pino-compatible logger interface
 */
export namespace Logging {
  export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent" | (string & {});

  export interface LogFn {
    (obj: object, msg?: string, ...args: any[]): void;
    (obj: unknown, msg?: string, ...args: any[]): void;
    (msg: string, ...args: any[]): void;
  }

  export interface BaseLogger {
    level: LogLevel;

    fatal: LogFn;
    error: LogFn;
    warn: LogFn;
    info: LogFn;
    debug: LogFn;
    trace: LogFn;
    silent: LogFn;
  }
}