import { CoreApp } from '../CoreApp';

export interface IFastifySession {
  get(name: string): string

  set(name: string, value: string)

  delete()
}

export default class AuthService {
  protected app: CoreApp;

  constructor(app: CoreApp) {
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
}
