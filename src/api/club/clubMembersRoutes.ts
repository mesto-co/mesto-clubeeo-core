import App from '../../App';
import {simplePaginator} from '../../lib/crudHelpers'
import {arr, id, int, nullable, obj, str} from 'json-schema-blocks'
import Club from '../../models/Club'
import UserClubRole from '../../models/UserClubRole'
import {IsNull, Not} from 'typeorm'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/', {
      schema: {
        description: 'UserClubRole list',
        query: obj({
          page: id(),
          take: int(1, 1000),
        }, {
          optional: ['page', 'take'],
        }),
        params: obj({
          clubSlug: str(1),
        }),
        response: {
          200: obj({
            userClubRoles: arr(
              obj({
                id: id(),
                clubId: str(),
                user: obj({
                  id: id(),
                  screenName: str(),
                  imgUrl: str(),
                  wallets: arr(obj({
                    id: id(),
                    address: str(),
                    chain: str(),
                  })),
                  userExts: arr(obj({
                    id: id(),
                    service: str(),
                    extId: str(),
                    data: obj({}, {additionalProperties: true})
                  }))
                }),
                clubRole: nullable(obj({
                  id: id(),
                  name: str(),
                  clubId: id(),
                })),
                clubRoleToken: nullable(obj({
                  id: id(),
                  clubRole: obj({
                    id: id(),
                    name: str(),
                    clubId: id(),
                    // createdAt: str(),
                    // updatedAt: str(),
                  }),
                  // createdAt: str(),
                  // updatedAt: str(),
                })),
                createdAt: str(),
                updatedAt: str(),
              })
            ),
            pagination: obj({
              page: id(),
              take: int(1, 1000),
              skip: id(),
            })
          })
        }
      },
    }, async (req, resp) => {
      const pagination = simplePaginator(req.query);

      const club = await app.m.findOneByOrFail(Club, {
        slug: req.params.clubSlug,
      });

      const userClubRoles = await app.m.find(UserClubRole, {
        where: {
          club,
          user: {id: Not(IsNull())},
        },
        relations: ['user', 'user.wallets', 'user.userExts', 'clubRole', 'clubRoleToken', 'clubRoleToken.clubRole'],
        order: {id: 'DESC'},
        take: pagination.take,
        skip: pagination.skip,
      });

      resp.send({
        userClubRoles,
        pagination
      });
    });

    next();
  }
}
