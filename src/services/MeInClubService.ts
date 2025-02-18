import {BaseService} from './BaseService'
import User from '../models/User'
import Club from '../models/Club'

export class MeInClubService extends BaseService {
  async meInClub(user: User, club: Club) {
    const app = this.app;

    const isLoggedIn = !!user;

    if (!club) {
      return {
        isLoggedIn,
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

    const userData = user ? {
      screenName: user.screenName || `id${user.id}`,
    } : {}

    return {
      isLoggedIn,
      isMember,
      services,
      ...userData,
    };
  }

}
