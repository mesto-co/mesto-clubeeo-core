import { DeepPartial, EntityTarget, FindOptionsWhere } from "typeorm";

import { TCoreApp } from "../../ClubeeoCoreApp";
import { IUserRepo, IUserModel } from "./UserInterfaces";

export default class UserRepo<TUser extends IUserModel> implements IUserRepo<TUser> {
  constructor(
    protected entityClass: EntityTarget<TUser>,
    protected app: TCoreApp
  ) {}

  async findById(id: string) {
    return await this.app.m.findOneBy<TUser>(this.entityClass, { id } as FindOptionsWhere<TUser>);
  }

  async create(plainObject: DeepPartial<TUser>) {
    return await this.app.em.createAndSave(this.entityClass, plainObject);
  }
}