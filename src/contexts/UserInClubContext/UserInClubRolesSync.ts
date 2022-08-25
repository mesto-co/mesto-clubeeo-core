import {baseChain} from '../../lib/TChains'
import User from '../../models/User'
import TokenContract from '../../models/TokenContract'
import Wallet from '../../models/Wallet'
import Club from '../../models/Club'
import {EntityManager} from 'typeorm'
import {IBricksLogger} from 'bricks-ts-logger'
import ClubRoleTokenRepo from '../../models/repos/ClubRoleTokenRepo'
import UserClubRoleRepo from '../../models/repos/UserClubRoleRepo'
import {IWalletService} from '../../interfaces/services/IWalletService'

export interface IUserInClubRolesSyncDeps {
  m: EntityManager,
  WalletService: IWalletService,
  log: IBricksLogger,
  repos: {
    clubRoleToken: ClubRoleTokenRepo,
    userClubRole: UserClubRoleRepo,
  }
}

export class UserInClubRolesSync {
  protected app: IUserInClubRolesSyncDeps;
  protected user: User;
  protected club: Club;

  constructor(app: IUserInClubRolesSyncDeps, user: User, club: Club) {
    this.app = app;
    this.user = user;
    this.club = club;
  }

  async userOwnsToken(user: User, tokenContract: TokenContract) {
    try {
      //todo: use repo
      const userWallets = await this.app.m.findBy(Wallet, {
        user: {id: user.id},
        chain: baseChain(tokenContract.chain),
      });

      let doIOwn = false;
      for (const wallet of userWallets) {
        // check if wallet owns token
        doIOwn = (await this.app.WalletService.syncWalletTokenAmount(wallet, tokenContract) > 0) || doIOwn;
        // doIOwn = await ports.walletOwnsTokenCheck(wallet, tokenContract);

        // break if so
        //todo: "fast" mode
        // if (doIOwn) break;
      }

      return doIOwn;
    } catch (e) {
      this.app.log.error(e);
      return false;
    }
  }

  async roleSync() {
    if (!this.user) return false;

    const clubRoleTokens = await this.app.repos
      .clubRoleToken.findByClubWithTokenContract(this.club);

    let result = false;
    for (const clubRoleToken of clubRoleTokens) {
      const currentResult = await this.userOwnsToken(this.user, clubRoleToken.tokenContract);

      await this.app.repos
        .userClubRole.findOrCreate({
          user: this.user,
          club: this.club,
          clubRoleToken,
          enabled: currentResult,
        });

      result = result || currentResult;

      //todo: "fast" mode
      // if (result) break;
    }
    return result;
  }

}
