import App from '../App'
import {IFastifySession} from '../services/AuthService'
import User from '../models/User'
import Club from '../models/Club'

export interface IAuthContextRequest {
  session: IFastifySession
}

/**
 * Fastify Session context for authorization/authentication purposes
 */
export class AuthContext {
  readonly app: App;
  readonly req: IAuthContextRequest;
  protected user: User;

  constructor(app: App, req: IAuthContextRequest) {
    this.app = app;
    this.req = req;
  }

  get userId(): string | null {
    return this.app.auth.getUserId(this.req);
  }

  logOut() {
    return this.app.auth.logOut(this.req.session);
  }

  logIn(userId: string) {
    return this.app.auth.logIn(userId, this.req.session);
  }

  async getUser() {
    if (this.user === undefined) {
      this.user = await this.app.auth.getUser(this.req);
    }
    return this.user;
  }

  async getUserOrFail() {
    const result = this.getUser();
    if (!result) throw 'User is not signed in';
    return result;
  }

  async userInClubContext(club: Club) {
    return this.app.contexts.userInClub(
      await this.getUser(),
      club
    )
  }
}
