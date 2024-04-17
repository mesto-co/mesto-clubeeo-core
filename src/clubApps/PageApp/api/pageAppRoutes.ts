import App from '../../../App';
import {id, obj, str} from 'json-schema-blocks';
import {StatusCodes} from 'http-status-codes'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/:appId/page', {
      params: obj({
        clubId: str(1),
        appId: str(1),
      }),
    }, async (request, reply) => {
      const memberCtx = await app.auth.getUserInClubContext(request);
      const {club} = memberCtx;
      const {value: member} = await memberCtx.fetchMember();

      const clubApp = await app.repos.clubApp.findById(club, request.params.appId);
      if (!clubApp || !await app.engines.accessEngine.memberHasAccessToAppPage(member, clubApp, '')) {
        return reply.code(StatusCodes.FORBIDDEN).send({error: 'access denied'});
      }

      if (clubApp.appName !== 'page') return reply.code(StatusCodes.NOT_ACCEPTABLE).send({error: 'wrong app'});

      return {
        page: {
          content: clubApp.config['content'],
        },
      }
    });

    next();
  }

}
