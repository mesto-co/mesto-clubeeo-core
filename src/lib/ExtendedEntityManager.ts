import {ObjectType} from 'typeorm/common/ObjectType'
import {EntityManager} from 'typeorm/entity-manager/EntityManager'
import {DeepPartial} from 'typeorm/common/DeepPartial'
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'

export default class ExtendedEntityManager {
  protected m: EntityManager

  constructor(m: EntityManager) {
    this.m = m
  }

  async findOneOrInitBy<Entity>(entityClass: ObjectType<Entity>, where: FindOptionsWhere<Entity>, plainObject: DeepPartial<Entity>) {
    const value = await this.m.findOneBy(entityClass, where);
    if (value) {
      return { value, isCreated: false};
    } else {
      return { value: this.m.create(entityClass, {...where, ...plainObject}), isCreated: true };
    }
  }

  async findOneOrCreateBy<Entity>(entityClass: ObjectType<Entity>, where: FindOptionsWhere<Entity>, plainObject: DeepPartial<Entity>) {
    const value = await this.m.findOneBy(entityClass, where);
    if (value) {
      return { value, isCreated: false};
    } else {
      const newEntity = this.m.create(entityClass, {...where, ...plainObject})
      await this.m.save(newEntity);
      return { value: newEntity, isCreated: true};
    }
  }

  async initOrMergeBy<Entity>(entityClass: ObjectType<Entity>, where: FindOptionsWhere<Entity>, plainObject: DeepPartial<Entity>) {
    const value = await this.m.findOneBy(entityClass, where)
    if (value) {
      this.m.merge(entityClass, value, plainObject);
      return value;
    } else {
      return this.m.create(entityClass, {...where, ...plainObject})
    }
  }

  async createOrUpdateBy<Entity>(entityClass: ObjectType<Entity>, where: FindOptionsWhere<Entity>, plainObject: DeepPartial<Entity>) {
    const value = await this.initOrMergeBy(entityClass, where, plainObject)
    await this.m.save(value);
    return value;
  }
}
