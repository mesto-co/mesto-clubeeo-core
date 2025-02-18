import { IModelBase } from "../../models/ModelBase";
import { IUserModel } from "../user/UserInterfaces";
import { TExtServices } from '../../lib/enums'

export interface IUserExtModel<TUser extends IUserModel> extends IModelBase {
  user: TUser
  userId: string
  username: string;
  service: TExtServices;
  extId: string;
  lang: string;
  data: object;
  enabled: boolean;
}
