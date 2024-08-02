export function Once<C, T>(factory: (self: C) => T) {
  return function (target: C, propertyKey: string | symbol) {
    Object.defineProperty(target, propertyKey, {
      get: function (this: C) {
        const result = factory(this);
        Object.defineProperty(this, propertyKey, {get: () => result});
        return result;
      },
      enumerable: true,
      configurable: true
    });
  };
}
