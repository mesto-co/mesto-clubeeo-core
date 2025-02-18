import App from '../../App'
import {obj, str} from 'json-schema-blocks'
import Trigger from '../../models/Trigger'
import ClubRole from '../../models/ClubRole'
import ClubBadge from '../../models/ClubBadge'
import ClubExt from '../../models/ClubExt'
import ClubApp from '../../engines/AppsEngine/models/ClubApp'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/', {
      schema: {
        params: obj({
          clubSlug: str(),
        }),
      },
    }, async (req, resp) => {
      const userCtx = await app.auth.getUserContext(req);
      const club = await app.repos.club.findBySlugOrFail(req.params.clubSlug);
      const userInClub = userCtx.inClubContext(club);

      await userCtx.isPlatformAdmin() || await userInClub.requireRole('admin');

      const apps = await app.m.find(ClubApp, {
        where: {
          club: {id: club.id}
        },
        order: {
          id: 'DESC',
        }
      });

      const badges = await app.m.find(ClubBadge, {
        where: {
          club: {id: club.id}
        },
        order: {
          id: 'DESC',
        }
      });

      const exts = await app.m.find(ClubExt, {
        where: {
          club: {id: club.id}
        },
        order: {
          id: 'DESC',
        }
      });

      const roles = await app.m.find(ClubRole, {
        where: {
          club: {id: club.id}
        },
        order: {
          id: 'DESC',
        }
      });

      const triggers = await app.m.find(Trigger, {
        where: {
          club: {id: club.id}
        },
        order: {
          id: 'DESC',
        }
      });

      resp.send({
        data: {
          ...club,
          apps,
          badges,
          exts,
          roles,
          triggers,
        },
      });
    });

    next();
  }
}
