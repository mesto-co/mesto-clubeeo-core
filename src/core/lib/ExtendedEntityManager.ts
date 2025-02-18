import {ObjectType} from 'typeorm/common/ObjectType'
import {EntityManager} from 'typeorm/entity-manager/EntityManager'
import {DeepPartial} from 'typeorm/common/DeepPartial'
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'
import { EntityTarget } from 'typeorm'

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

  //todo: plainObject as a function
  async findOneOrCreateBy<Entity>(
    entityClass: ObjectType<Entity>,
    where: FindOptionsWhere<Entity>,
    plainObject: DeepPartial<Entity> | (() => DeepPartial<Entity>)
  ): Promise<{ value: Entity, isCreated: boolean }> {
    const value = await this.m.findOneBy(entityClass, where);
    if (value) {
      return { value, isCreated: false};
    } else {
      const plainObjectValue = plainObject instanceof Function ? plainObject() : plainObject;
      const newEntity = this.m.create(entityClass, {...where, ...plainObjectValue})
      await this.m.save(newEntity);
      return { value: newEntity, isCreated: true};
    }
  }

  async createOrLazyUpdateBy<Entity>(
    entityClass: ObjectType<Entity>,
    where: FindOptionsWhere<Entity>,
    plainObject: DeepPartial<Entity>,
    plainObjectMerge?: DeepPartial<Entity>
  ) {
    const value = await this.m.findOneBy(entityClass, where);
    if (value) {
      // check if values are changed (lazy update)
      let isChanged = false;
      for (const key of Object.getOwnPropertyNames(plainObject)) {
        if (value[key] !== plainObject[key]) {
          isChanged = true;
          break;
        }
      }

      // update if changed
      if (isChanged) {
        this.m.merge(entityClass, value, plainObject);
        await this.m.save(value);
      }

      return { value, isCreated: false, isChanged};
    } else {
      const newEntity = this.m.create(entityClass, {...where, ...plainObject, ...plainObjectMerge})
      await this.m.save(newEntity);
      return { value: newEntity, isCreated: true, isChanged: true};
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

  async updateIfExistBy<Entity>(entityClass: ObjectType<Entity>, where: FindOptionsWhere<Entity>, plainObject: DeepPartial<Entity>) {
    const value = await this.m.findOneBy(entityClass, where)
    if (value) {
      this.m.merge(entityClass, value, plainObject);
      await this.m.save(value);
      return value;
    } else {
      return null;
    }
  }

  async createOrUpdateBy<Entity>(entityClass: ObjectType<Entity>, where: FindOptionsWhere<Entity>, plainObject: DeepPartial<Entity>) {
    const value = await this.initOrMergeBy(entityClass, where, plainObject)
    await this.m.save(value);
    return value;
  }

  async createAndSave<Entity>(entityClass: EntityTarget<Entity>, plainObject: DeepPartial<Entity>) {
    const value = this.m.create(entityClass, plainObject)
    await this.m.save(value);
    return value;
  }
}

export { ExtendedEntityManager };