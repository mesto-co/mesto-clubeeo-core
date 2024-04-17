import App from '../../../App';
import {obj, str} from 'json-schema-blocks';
import {StatusCodes} from 'http-status-codes'
import ClubBadge from '../../../models/ClubBadge'
import MemberBadge from '../../../models/MemberBadge'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/:appId/leaderboard', {
      params: obj({
        clubId: str(1),
        appId: str(1),
      })
    }, async (request, reply) => {
      const memberCtx = await app.auth.getUserInClubContext(request);
      const {club, user} = memberCtx;

      const clubApp = await app.repos.clubApp.findById(club, request.params.appId);
      if (!clubApp || !await app.engines.accessEngine.userHasAccessToApp(user, clubApp)) {
        return reply.code(StatusCodes.FORBIDDEN).send({ error: 'access denied' });
      }

      if (clubApp.appName !== 'leaderboard') return reply.code(StatusCodes.NOT_ACCEPTABLE).send({ error: 'wrong app' });

      const badgeId = clubApp.config['badgeId'];
      if (!badgeId) return reply.code(StatusCodes.NOT_ACCEPTABLE).send({ error: 'badge is not set up' });

      const clubBadge = await app.m.findOneByOrFail(ClubBadge, {
        id: badgeId,
        club: {id: club.id},
      });

      const memberBadges = await app.m.find(MemberBadge, {
        where: {
          clubBadge: {id: clubBadge.id},
          club: {id: club.id},
        },
        order: {
          value: 'DESC'
        },
        relations: {
          user: true,
          member: true,
        },
        take: 100,
      });

      const leaderboard = memberBadges.map((mb, i) => ({
        position: i+1,
        name: mb.user.screenName || `# ${mb.member.id}`, //todo: use member name
        value: mb.value || 0,
      }))

      return {
        leaderboard,
      }
    });

    next();
  }

}
