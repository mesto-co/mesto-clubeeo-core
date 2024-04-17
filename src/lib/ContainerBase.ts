export class ContainerBase {
  readonly registry: Record<string, any> = {};

  protected initOnce<T>(key: string, init: () => T): T {
    return key in this.registry ? this.registry[key] as T : init();
  }

  protected patch<T>(key: string, init: () => T): T {
    const val = init();
    Object.defineProperty(this, key, {get: () => val});
    return val;
  }
}
