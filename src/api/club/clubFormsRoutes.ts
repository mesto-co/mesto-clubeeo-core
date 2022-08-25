import App from '../../App';
import {id, obj, str} from 'json-schema-blocks'
import Club from '../../models/Club'
import ClubFormApplication from '../../models/ClubFormApplication'
import ClubApp from '../../models/ClubApp'

export default function (app: App) {
  return function (router, opts, next) {
    router.post('/', {
      schema: {
        description: 'Save application form',
        params: obj({
          clubId: id(),
        }),
        body: obj({
          formType: str()
        }, {optional: ['formType']}),
        response: {
          200: obj({
            clubFormApplication: obj({
              id: id(),
              clubId: id(),
              userId: id(),
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

      resp.send({
        clubFormApplication,
      });
    });

    next();
  }
}
