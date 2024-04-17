import App from '../App';
import {bool, id, nullable, obj, str} from 'json-schema-blocks'
import Club from '../models/Club'
import {In} from 'typeorm'
import ClubApp from '../engines/AppEngine/models/ClubApp'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/:clubSlug/:appSlug', {
      schema: {
        params: {
          clubSlug: str(),
          appSlug: str(),
        },
        response: {
          200: obj({
            clubApp: nullable(obj({
              id: str(1),
              title: str(),
            })),
            data: obj({}, {additionalProperties: true}),
            isMember: bool(),
            hasAccess: bool(),
            appName: nullable(str()),
          })
        }
      },
    }, async (req, resp) => {
      const clubSlug = req.params.clubSlug;
      const appSlug = req.params.appSlug;

      const user = await app.auth.getUser(req);

      const club = await app.m.findOneOrFail(Club, {
        where: {slug: clubSlug}
      });

      const userInClub = app.contexts.userInClub(user, club);
      if (!await userInClub.isMember({useCache: true})) {
        resp.send({ isMember: false, hasAccess: false, data: null });
        return;
      }

      const roles = await userInClub.roles();
      const clubAppsCount = await app.m.count(ClubApp, {
        where: {
          appSlug,
          club: {id: club.id},
          clubAppRoles: {
            clubRole: {
              name: In(roles.map(role => role.name))
            }
          }
        }
      });
      if (clubAppsCount === 0) {
        resp.send({ clubApp: null, isMember: true, hasAccess: false, data: {}, appName: null });
        return;
      }

      const clubApp = await app.clubAppFactory.buildBySlug(appSlug, club);

      const data = clubApp ? await clubApp.getDataFor({user}) : {};

      resp.send({
        clubApp: clubApp?.clubApp,
        appName: clubApp?.appName || null,
        isMember: true,
        hasAccess: true,
        data,
      });
    });

    next();
  }

}
