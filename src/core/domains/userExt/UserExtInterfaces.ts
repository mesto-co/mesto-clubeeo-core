import { DeepPartial } from "typeorm";
import { IModelBase } from "../../models/ModelBase";
import { IUserModel } from "../user/UserInterfaces";
import { ExtService } from '../../lib/enums'

export interface IUserExtModel<TUser extends IUserModel> extends IModelBase {
  user: TUser
  userId: string
  username: string;
  service: ExtService;
  extId: string;
  lang: string;
  data: object;
  enabled: boolean;
}
