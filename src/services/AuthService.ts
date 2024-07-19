import App from '../App';
import User from '../models/User';
import {ExtError} from '../lib/errors/ExtError'
import {StatusCodes} from 'http-status-codes'

export interface IFastifySession {
  get(name: string): string

  set(name: string, value: string)

  delete()
}

export default class AuthService {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

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

    return await this.app.m.findOneBy(User, {id: userId});
  }

  async requireUser(req: { session: IFastifySession }) {
    const user = this.getUser(req);
    if (!user) throw new ExtError('User is not authorized', StatusCodes.UNAUTHORIZED);
    return user;
  }

  async getUserContext(req: { session: IFastifySession }) {
    const user = await this.requireUser(req);
    return this.app.contexts.user(user);
  }

  async getUserInClubContext(req: { session: IFastifySession, params: { clubId?: string, clubSlug?: string, clubLocator?: string } }) {
    const cUser = await this.getUserContext(req);
    const club = await this.app.repos.club.findByParamOrFail(req.params);
    return cUser.inClubContext(club);
  }
}