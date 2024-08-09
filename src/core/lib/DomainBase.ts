import { TCoreApp } from '../CoreApp';
import { ContainerBase } from './ContainerBase';
import { EntityManager, EntityTarget } from 'typeorm';

export default class DomainBase<Entity> extends ContainerBase {
  constructor(
    protected app: {
      m: EntityManager,
    },
    protected entityTarget: EntityTarget<Entity>
  ) {
    super();
  }

  get repo() { return this.once('repo', () => this.app.m.getRepository(this.entityTarget)); }

}
