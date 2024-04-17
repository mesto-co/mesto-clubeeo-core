import App from '../../../App';
import {obj, str} from 'json-schema-blocks';
import {StatusCodes} from 'http-status-codes'
import Post from '../../../models/Post'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/:appId/feed', {
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

      if (clubApp.appName !== 'feed') return reply.code(StatusCodes.NOT_ACCEPTABLE).send({ error: 'wrong app' });

      const posts = await app.m.find(Post, {
        where: {
          club: {id: club.id},
          clubApp: {id: clubApp.id},
        },
        relations: {
          author: true,
          // comments: true,
        },
        order: {id: 'DESC'},
      });

      return {
        posts,
      }
    });

    next();
  }

}
