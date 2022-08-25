export interface IModelHooksService {
  beforeCreate: <T>(model: string, data: T) => void;
  afterCreate: <T>(model: string, data: T) => void;

  beforeUpdate: <T>(model: string, data: T, prevData: T) => void;
  afterUpdate: <T>(model: string, data: T, prevData: T) => void;

  beforeDelete: <T>(model: string, data: T) => void;
  afterDelete: <T>(model: string, data: T) => void;
}

export class ModelHooksDummyService implements IModelHooksService {
  constructor(app) {
  }

  beforeCreate<T>(model: string, data: T) {}
  afterCreate<T>(model: string, data: T) {}

  beforeUpdate<T>(model: string, data: T, prevData: T) {}
  afterUpdate<T>(model: string, data: T, prevData: T) {}

  beforeDelete<T>(model: string, data: T) {}
  afterDelete<T>(model: string, data: T) {}
}
