import { EntityTarget } from 'typeorm';

import { TCoreApp } from "../../ClubeeoCoreApp";
import UserRepo from "./UserRepo";
import { IUserModel } from './UserInterfaces';
import { ContainerBase } from '../../lib/ContainerBase';
import DomainBase from '../../lib/DomainBase';

// export default class UserDomain<TUser extends IUserModel> extends ContainerBase {
//   constructor(
//     protected app: TCoreApp,
//     protected entityTarget: EntityTarget<TUser> = 'User'
//   ) {
//     super();
//   }

//   get repo() { return this.once('repo', () => new UserRepo(this.entityTarget, this.app)) }

// }

export default class UserExtDomain<
    TUser extends IUserModel
> extends DomainBase<TUser> {
    // constructor(app: TCoreApp, entityTarget: EntityTarget<TUser>) {
    //     super(app, entityTarget);
    // }
}
