import {BaseService} from './BaseService'
import User from '../models/User'
import Club from '../models/Club'

export class MeInClubService extends BaseService {
  async meInClub(user: User, club: Club) {
    const app = this.app;

    if (!club) {
      return {
        isMember: false
      }
    }

    const userInClubCtx = this.app.contexts.userInClub(user, club);
    const clubCtx = userInClubCtx.clubContext;
    const userCtx = userInClubCtx.userContext;

    const isMember = await userInClubCtx.isMember();

    const tgLoggedIn = await userCtx.telegramIsLoggedIn();
    const services = {
      tg: {
        chatInviteLink: await clubCtx.telegramInviteLink() || '',
        telegramLoginBot: app.Env.tgLoginBot,
        telegramLoginCode: tgLoggedIn ? null : await app.repos.extCode.fetchTgLoginCode(user, club),
        loggedIn: tgLoggedIn,
      }
    };

    const ethEnabled = Boolean(club.settings.eth?.enabled || club.settings.eth?.enabled === undefined);
    const nearEnabled = Boolean(club.settings.near?.enabled);

    const wallets = {
      eth: {
        loggedIn: await userCtx.ethWalletIsLoggedIn(),
        enabled: ethEnabled,
      },
      near: {
        loggedIn: await userCtx.nearWalletIsLoggedIn(),
        enabled: nearEnabled,
      }
    };

    return {
      isMember,
      services,
      wallets,
    };
  }

}
