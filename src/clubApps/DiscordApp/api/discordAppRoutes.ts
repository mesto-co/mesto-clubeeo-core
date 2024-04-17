import discordDaemon from '../discordDaemon'
import {bool, obj, str} from 'json-schema-blocks'
import {StatusCodes} from 'http-status-codes'
import UserExt from '../../../models/UserExt'
import {DiscordContainer} from '../DiscordContainer'
import assert from 'assert'
import {ExtService} from '../../../lib/enums'
import {discordSyncMemberRoles} from '../procedures/discordSyncMemberRoles'

export default function (c: DiscordContainer) {
  const app = c.app;

  return function (router, opts, next) {

    router.post('/validate-user', {
      schema: {
        description: 'Validate user',
        body: obj({
          code: str(1),
        }),
        response: {
          200: obj({
            ok: bool(),
            isChanged: bool(),
            isMember: bool(),
          }),
        },
      },
    }, async function (req, res) {
      const user = await app.auth.getUser(req);
      if (!user) return res.code(StatusCodes.FORBIDDEN).send({ok: false, error: 'Access denied'});

      const code = req.body.code;

      app.log.info('discord:validate-user', {data: {userId: user.id, code}});

      const extCode = await app.repos.extCode.findDiscordVerify(code);
      if (!extCode) {
        app.log.info('discord:validate-user:not-found', {data: {userId: user.id, code}});
        return res.code(StatusCodes.NOT_FOUND).send({ok: false, error: 'Verification code is not found'});
      }
      extCode.used = true;
      await app.m.save(extCode);

      const club = extCode.club;
      const clubExt = extCode.clubExt;
      assert(club, 'club is not found');
      assert(clubExt, 'clubExt is not found');

      let userExt = await app.m.findOneBy(UserExt, {
        user: {id: user.id},
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

      const {isChanged, isMember} = await discordSyncMemberRoles({app, log: app.log},{user, userExt, club, clubExt})

      res.send({
        ok: true,
        isChanged,
        isMember,
      });
    });

    next();
  }
}
