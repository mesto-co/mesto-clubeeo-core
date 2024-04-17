import User from '../../../models/User'
import Club from '../../../models/Club'
import ClubExt from '../../../models/ClubExt'
import UserExt from '../../../models/UserExt'
import DiscordApp from '../DiscordApp'
import App from '../../../App'
import {IBricksLogger} from 'bricks-ts-logger'
import ClubApp from '../../../engines/AppEngine/models/ClubApp'

export async function discordSyncMemberRoles(
  deps: { app: App, log: IBricksLogger },
  opts: { user: User, club: Club, clubExt: ClubExt, userExt: UserExt },
) {
  const app = deps.app;
  const log = deps.log;

  const user = opts.user;
  const club = opts.club;
  const clubExt = opts.clubExt;
  const userExt = opts.userExt;

  const clubApp = clubExt.clubAppId ? await app.m.findOneBy(ClubApp, {
    id: clubExt.clubAppId,
  }) : null;

  // update wallet data
  const userInClubContext = app.contexts.userInClub(user, club);
  const isMember = await userInClubContext.isMember({forceSync: true});

  const discordApp = new DiscordApp({app});

  let isChanged: Boolean = false;
  if (isMember) {
    const roles = await userInClubContext.roles();
    for (let role of roles) {
      // don't sync admin role
      if (role.name === 'admin') continue;

      // sync only whitelisted roles if syncRoles is configured
      const syncRoles = clubApp?.config?.syncRoles;
      if (syncRoles) {
        if (!syncRoles.includes(role.name)) continue;
      }

      isChanged = await discordApp.enableUser({
        userExt,
        clubExt,
        role: role.name,
      });
    }

    // fallback
    if (roles.length === 0) {
      isChanged = await discordApp.enableUser({
        userExt,
        clubExt,
      });

      log.warn(`user is a member, but don't have certain roles: fallback to syncing "holder" role to Discord (enable)`, {
        data: {userId: user.id},
      });
    }
  } else {
    const roles = await userInClubContext.roles();
    for (let role of roles) {
      // don't sync admin role
      if (role.name === 'admin') continue;

      // sync only whitelisted roles if syncRoles is configured
      const syncRoles = clubApp?.config?.syncRoles;
      if (syncRoles) {
        if (!syncRoles.includes(role.name)) continue;
      }

      isChanged = await discordApp.disableUser({
        userExt,
        clubExt,
      });
    }

    // fallback
    if (roles.length === 0) {
      isChanged = await discordApp.disableUser({
        userExt,
        clubExt,
      });

      log.warn(`user is a member, but don't have certain roles: fallback to syncing "holder" role to Discord (disable)`, {
        data: {userId: user.id},
      });
    }
  }

  return {isChanged, isMember}
}
