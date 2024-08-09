import { EntityTarget } from "typeorm";
import CoreApp from "./CoreApp";
import UserDomain from "./domains/user/UserDomain";
import { IUserModel } from "./domains/user/UserInterfaces";
import UserExtDomain from "./domains/userExt/UserExtDomain";
import { IUserExtModel } from "./domains/userExt/UserExtInterfaces";
import { ContainerBase } from "./lib/ContainerBase";

export default class CoreDomains<
    TUser extends IUserModel,
    TUserExt extends IUserExtModel<TUser>
> extends ContainerBase {

  constructor(protected app: CoreApp<TUser, TUserExt>, protected models: {
    User: EntityTarget<TUser>,
    UserExt: EntityTarget<TUserExt>
  }) {
    super();
  }

  get user() { return this.once('user', () => new UserDomain(this.app, this.models.User)) }

  get userExt() { return this.once('userExt', () => new UserExtDomain(this.app, this.models.UserExt)) }

  // @Once((self: CoreDomains<TUser, TUserExt>) => new UserDomain<TUser>(self.app))
  // user: UserDomain<TUser>;

  // @Once((self: CoreDomains<TUser, TUserExt>) => new UserExtDomain<TUser, TUserExt>(self.app))
  // userExt: UserExtDomain<TUser, TUserExt>;

}