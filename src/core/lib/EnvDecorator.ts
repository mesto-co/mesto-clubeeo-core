export const envCase = (str: string) => {
  return str.split('').map((letter, idx) => {
    return letter.toUpperCase() === letter
      ? `${idx !== 0 ? '_' : ''}${letter.toUpperCase()}`
      : letter.toUpperCase();
  }).join('');
}

export interface IEnvConfig {
  type?: StringConstructor | NumberConstructor | BooleanConstructor | 'json',
  default?: IEnvDefault,
  key?: string,
}

export type IEnvDefault = string | number | ((target: any) => string | number);

export function Env(config?: IEnvDefault | IEnvConfig) {
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
