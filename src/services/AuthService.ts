import App from '../App';
import User from '../models/User';
import {ExtError} from '../core/lib/ExtError'
import {StatusCodes} from 'http-status-codes'
import CoreAuthService from '../core/services/AuthService'

export interface IFastifySession {
  get(name: string): string

  set(name: string, value: string)

  delete()
}

export default class AuthService extends CoreAuthService<User> {
  protected app: App;

  constructor(app: App) {
    super(app);
    this.app = app;
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
