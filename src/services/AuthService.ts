import App from '../App';
import User from '../models/User';

export interface IFastifySession {
  get(name: string): string | number
  set(name: string, value: string | number)
  delete()
}

export default class AuthService {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  getUserId(req: {session: IFastifySession}): number | null {
    const userId = req.session.get('userId')
    return userId ? Number(userId) : null
  }

  logOut(session: IFastifySession) {
    session.delete()
  }

  logIn(userId: number, session: IFastifySession) {
    session.set('userId', userId)
    session.set('loginAt', Date.now())
  }

  async getUser(req: {session: IFastifySession}) {
    const userId = this.getUserId(req);
    if (!userId) return null;

    return await this.app.m.findOneBy(User, {id: userId});
  }

  async getUserContext(req: {session: IFastifySession}) {
    const user = await this.getUser(req);
    return this.app.contexts.user(user);
  }
}
