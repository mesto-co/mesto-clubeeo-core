import { IUserExtModel } from './UserExtInterfaces';
import { IUserModel } from '../user/UserInterfaces';
import DomainBase from '../../lib/DomainBase';
import { TCoreApp } from '../../ClubeeoCoreApp';
import { EntityTarget } from 'typeorm';

export default class UserExtDomain<
    TUser extends IUserModel,
    TUserExt extends IUserExtModel<TUser>
> extends DomainBase<TUserExt> {
    // constructor(app: TCoreApp, entityTarget: EntityTarget<TUserExt>) {
    //     super(app, entityTarget);
    // }
}
