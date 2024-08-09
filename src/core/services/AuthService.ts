import { StatusCodes } from 'http-status-codes';
import { ExtError } from '../lib/ExtError';
import CoreApp, { TCoreApp } from '../CoreApp';
import { IUserModel } from '../domains/user/UserInterfaces';
import { FindOptionsWhere } from 'typeorm';
import User from '../../models/User';

export interface IFastifySession {
  get(name: string): string

  set(name: string, value: string)

  delete()
}

// type TAuthServiceDep<TUser extends IUserModel> = {
//   domains: {
//     user: {
//       repo: {
//         findById(id: string): Promise<TUser>
//       }
//     }
//   }
// }

export default class AuthService<TUser extends IUserModel> {
  // constructor(protected app: TAuthServiceDep<TUser>) {}
  constructor(protected app: TCoreApp) {}

  getUserId(req: { session: IFastifySession }): string | null {
    const userId = req.session.get('userId')
    return userId ? userId : null
  }

  logOut(session: IFastifySession) {
    session.delete()
  }

  logIn(userId: string, session: IFastifySession) {
    session.set('userId', String(userId))
    session.set('loginAt', String(Date.now()))
  }

  async getUser(req: { session: IFastifySession }) {
    const userId = this.getUserId(req);
    if (!userId) return null;

    return await this.app.m.findOneBy(User, { id: userId } as FindOptionsWhere<User>);
    // return await this.app.domains.user.repo.findById(userId);
  }

  async requireUser(req: { session: IFastifySession }) {
    const user = this.getUser(req);
    if (!user) throw new ExtError('User is not authorized', StatusCodes.UNAUTHORIZED);
    return user;
  }

}
