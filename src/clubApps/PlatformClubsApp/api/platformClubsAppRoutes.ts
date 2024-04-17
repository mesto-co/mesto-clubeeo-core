import App from '../../../App';
import {arr, id, int, obj, str} from 'json-schema-blocks';
import User from '../../../models/User';
import {ILike, In} from 'typeorm';
import {UserExtMessageBatch} from '../../../models/UserExtMessageBatch';
import {sanitizeHtmlDefault} from '../../../lib/sanitize';
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'
import Club from '../../../models/Club'
import {simplePaginator, simplePaginatorQuery} from '../../../lib/crudHelpers'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/', {
      params: obj({
        clubId: str(1),
      }),
      query: simplePaginatorQuery,
    }, async (request, reply) => {
      const club = await app.m.findOneByOrFail(Club, {id: request.params.clubId, slug: 'admin'});
      const userCtx = await app.auth.getUserContext(request);
      await userCtx.requirePlatformAdmin();

      const pagination = simplePaginator(request.query);

      const clubs = await app.m.find(Club, {
        order: {
          id: 'DESC',
        },
        take: pagination.take,
        skip: pagination.skip,
      });

      return {
        clubs
      }
    });

    next();
  }

}
