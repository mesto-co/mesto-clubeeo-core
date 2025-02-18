import { envCase } from "./EnvDecorator";

export class EnvBuilder<T extends object = {}> {
  private env: T;

  constructor(env: T = {} as T) {
    this.env = env;
  }

  str<K extends string>(key: K, defaultValue: string): EnvBuilder<T & { [P in K]: string }> {
    const existingValue = (this.env as any)[key] as string | undefined;

    return new EnvBuilder({
      ...this.env,
      [key]: String(process.env[envCase(key)] || existingValue || defaultValue),
    } as T & { [P in K]: string });
  }

  num<K extends string>(key: K, defaultValue: number): EnvBuilder<T & { [P in K]: number }> {
    const value = process.env[envCase(key)];
    return new EnvBuilder({
      ...this.env,
      [key]: value ? parseInt(value) : defaultValue,
    } as T & { [P in K]: number });
  }

  bool<K extends string>(key: K, defaultValue: boolean): EnvBuilder<T & { [P in K]: boolean }> {
    const value = process.env[envCase(key)];
    return new EnvBuilder({
      ...this.env,
      [key]: value ? (value.toLowerCase() === 'true' || value === '1') : defaultValue,
    } as T & { [P in K]: boolean });
  }

  json<K extends string, J>(key: K, defaultValue: J): EnvBuilder<T & { [P in K]: J }> {
    const value = process.env[envCase(key)];
    return new EnvBuilder({
      ...this.env,
      [key]: value ? JSON.parse(value) : defaultValue,
    } as T & { [P in K]: J });
  }

  build(): T {
    return this.env;
  }
}