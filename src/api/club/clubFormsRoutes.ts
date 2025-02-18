import App from '../../App';
import {id, obj, str} from 'json-schema-blocks'
import Club from '../../models/Club'
import ClubFormApplication from '../../models/ClubFormApplication'
import ClubApp from '../../engines/AppsEngine/models/ClubApp'

export default function (app: App) {
  return function (router, opts, next) {
    router.post('/', {
      schema: {
        description: 'Save application form',
        params: obj({
          clubId: str(1),
        }),
        body: obj({
          formType: str()
        }, {optional: ['formType']}),
        response: {
          200: obj({
            clubFormApplication: obj({
              id: str(1),
              clubId: str(1),
              userId: str(1),
              formType: str(),
            })
          })
        }
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req);
      const formType = req.body.formType || '';

      const club = await app.m.findOneByOrFail(Club, {
        id: req.params.clubId,
      });

      const clubFormApplication = app.m.create(ClubFormApplication, {
        club: {id: club.id},
        user: {id: user?.id},
        formType,
      });
      await app.m.save(clubFormApplication);

      // maybe grant badge
      const applicationFormClubApp = await app.m.findOneBy(ClubApp, {
        club: {id: club.id},
        appName: 'application-form',
        appSlug: formType,
      });
      if (applicationFormClubApp) {
        const badgeSlug = applicationFormClubApp.config['badgeSlug'];

        if (badgeSlug) {
          const grantedBadge = await app.engines.badgeEngine.grantBadgeBySlug(user, club, badgeSlug);
          if (!grantedBadge) {
            app.log.warn('badgeNotGranted', {data: {userId: user.id, clubId: club.id, badgeSlug}})
          }
        }

        const roleSlug = applicationFormClubApp.config['roleSlug'];

        if (roleSlug) {
          const grantedRole = await app.engines.roleEngine.grantRoleToUserBySlug(user, club, roleSlug);
          if (!grantedRole) {
            app.log.warn('roleNotGranted', {data: {userId: user.id, clubId: club.id, roleSlug}})
          }
        }

      }

      resp.send({
        clubFormApplication,
      });
    });

    next();
  }
}
