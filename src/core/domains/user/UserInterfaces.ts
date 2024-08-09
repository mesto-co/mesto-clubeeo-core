import { DeepPartial } from "typeorm";
import { IModelBase } from "../../models/ModelBase";

export interface IUserModel extends IModelBase {
  email: string;
  password: string;
  screenName: string;
  timezone: string;
  lang: string;
}

export interface IUserRepo<TUser extends IUserModel> {
  findById(id: string): Promise<TUser | null>;
  create(plainObject: DeepPartial<TUser>): Promise<TUser>;
}
