import discordDaemon from '../discordDaemon'
import {bool, obj, str} from 'json-schema-blocks'
import {StatusCodes} from 'http-status-codes'
import UserExt from '../../../models/UserExt'
import {DiscordContainer} from '../DiscordContainer'
import DiscordApp from '../DiscordApp'
import assert from 'assert'
import {ExtService} from '../../../lib/enums'

export default function (c: DiscordContainer) {
  const app = c.app;

  if (app.Env.runWorker || app.Env.nodeEnv === 'development') {
    discordDaemon(c);
  }

  return function (router, opts, next) {

    router.post('/validate-user', {
      schema: {
        description: 'Validate user',
        body: obj({
          code: str(1)
        }),
        response: {
          200: obj({
            ok: bool(),
            isChanged: bool(),
            isMember: bool(),
          }),
        },
      }
    }, async function (req, res) {
      const user = await app.auth.getUser(req);
      if (!user) return res.code(StatusCodes.FORBIDDEN).send({ok: false, error: 'Access denied'});

      const extCode = await app.repos.extCode.findDiscordVerify(req.body.code);
      if (!extCode) {
        return res.code(StatusCodes.NOT_FOUND).send({ok: false, error: 'Verification code is not found'});
      }
      extCode.used = true;
      await app.m.save(extCode);

      const club = extCode.club;
      const clubExt = extCode.clubExt;
      assert(club, 'club is not found');
      assert(clubExt, 'clubExt is not found');

      let userExt = await app.m.findOneBy(UserExt, {
        user,
        service: ExtService.discord,
        extId: extCode.extId,
      });
      if (!userExt) {
        userExt = app.m.create(UserExt, {
          user,
          service: ExtService.discord,
          extId: extCode.extId,
        });
        await app.m.save(userExt);
      }

      // update wallet data
      const userInClubContext = app.contexts.userInClub(user, club);
      const isMember = await userInClubContext.isMember();

      const discordApp = new DiscordApp({app});

      let isChanged: Boolean;
      if (isMember) {
        const roles = await userInClubContext.roles();
        for (let role of roles) {
          // don't sync admin role
          if (role.name === 'admin') continue;

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

          app.log.warn(`user is a member, but don't have certain roles: fallback to syncing "holder" role to Discord (enable)`)
        }
      } else {
        const roles = await userInClubContext.roles();
        for (let role of roles) {
          // don't sync admin role
          if (role.name === 'admin') continue;

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

          app.log.warn(`user is a member, but don't have certain roles: fallback to syncing "holder" role to Discord (disable)`)
        }
      }

      res.send({
        ok: true,
        isChanged,
        isMember
      });
    });

    next();
  }
}
