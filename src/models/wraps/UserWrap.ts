import User from '../User'

export class UserWrap {
  user: User;

  constructor(user: User) {
    this.user = user;
  }

  get screenNameView() {
    return this.user.screenName || `id${this.user.id}`;
  }
}
