import { ContainerBase } from "./ContainerBase";
import _ from "lodash";

export class EngineBase extends ContainerBase {
  readonly type = 'engine';
}


export type EngineConstructor<C, T> = new (c: C) => T;

export class EnginesContainerBase<C>  extends ContainerBase {
  protected engines: Record<string, any> = {};
  enabledEngines: string[] = [];

  constructor(protected c: C) {
    super();
  }

  async forEachEngine(fn: (engine: any) => Promise<void>) {
    for (const engineName of this.enabledEngines) {
      const engine = this[engineName];
      await fn(engine);
    }
  }

  async callEachEngine(method: string, ...args: any[]) {
    for (const engineName of this.enabledEngines) {
      const engine = this[engineName];
      if (method in engine) {
        // this.c.logger.info({method, engineName}, `${engineName}.${method}: call`);
        await engine[method](...args);
        // this.c.logger.info({method, engineName}, `${engineName}.${method}: done`);
      }
    }
  }

  enableEngines(...engines: string[]) {
    this.enabledEngines = _.uniq([...this.enabledEngines, ...engines]);
    return this;
  }

  disableEngines(...engines: string[]) {
    this.enabledEngines = this.enabledEngines.filter(e => !engines.includes(e));
    return this;
  }

  mount<K extends string, T>(key: K, Engine: EngineConstructor<C, T>): this & Record<K, T> {
    Object.defineProperty(this, key, {
      get: () => {
        if (!this.engines[key]) {
          this.engines[key] = new Engine(this.c);
        }
        return this.engines[key];
      },
      enumerable: true,
      configurable: true,
    });

    this.onMounted(key);

    return this as this & Record<K, T>;
  }

  protected onMounted(key: string) {
    // automatically add to enabled engines list
    this.enableEngines(key);
  }
}
