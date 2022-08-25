import App from '../App'
import User from '../models/User'
import UserExt from '../models/UserExt'
import Wallet from '../models/Wallet'
import {EvmChainsEnum, NearChainsEnum} from '../lib/TChains'
import {In} from 'typeorm'
import Club from '../models/Club'
import {ExtService} from '../lib/enums'

export class UserContext {
  readonly app: App;
  readonly user: User;

  constructor(app: App, user: User) {
    this.app = app;
    this.user = user;
  }

  get contextModels() {
    return {
      user: this.user,
    }
  }

  inClubContext(club: Club) {
    return this.app.contexts.userInClub(this.user, club);
  }

  async telegramIsLoggedIn() {
    if (!this.user) return false;

    const userExtCount = await this.app.m.countBy(UserExt, {
      service: ExtService.tg,
      user: {id: this.user.id},
      enabled: true,
    });
    return userExtCount > 0;
  }

  async ethWalletIsLoggedIn() {
    if (!this.user) return false;

    const userWalletCount = await this.app.m.countBy(Wallet, {
      user: {id: this.user.id},
      chain: EvmChainsEnum.eth,
    });
    return userWalletCount > 0;
  }

  async nearWalletIsLoggedIn() {
    if (!this.user) return false;

    const userWalletCount = await this.app.m.countBy(Wallet, {
      user: {id: this.user.id},
      chain: In(Object.keys(NearChainsEnum))
    });
    return userWalletCount > 0;
  }

  async isPlatformAdmin() {
    const adminClub = await this.app.m.findOneBy(Club, {slug: 'admin'});
    if (!adminClub) return false;
    return await this.inClubContext(adminClub).hasRole('admin');
  }
}
