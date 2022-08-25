import App from '../App';
import {simplePaginator} from '../lib/crudHelpers';
import {StatusCodes} from 'http-status-codes';
import {arr, id, int, nullable, obj, str} from 'json-schema-blocks';
import Club from '../models/Club';

// fields presented in all requests & responses
export const clubBaseSchema = {
  name: str(),
  slug: str(),
  description: str(),
  welcome: str(),
  itemsCount: nullable(int()),
  website: str(),
  buyLinks: obj({
    opensea: str(),
    rarible: str()
  }, {additionalProperties: true, required: []}),
  socialLinks: obj({
    telegram: str(),
    discord: str(),
    instagram: str(),
    twitter: str(),
    etherscan: str(),
    web: str(),
  }, {additionalProperties: true, required: []}),
  style: obj({
    primaryColor: str(),
    heroImg: str(),
    logoImg: str(),
  }, {additionalProperties: true, required: []}),
  // ownerId: nullable(id()),
}

// modifiable fields (create & update)
export const clubModifySchema = {
  ...clubBaseSchema
}

// response schema
export const clubViewSchema = {
  id: id(),
  ...clubBaseSchema,
  createdAt: str(),
  updatedAt: str(),
}

export const clubResponseSchema = {
  club: obj(clubViewSchema),
}

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/', {
      schema: {
        description: 'Club list',
        query: obj({
          page: id(),
          take: int(1, 1000),
        }, {
          optional: ['page', 'take'],
        }),
        response: {
          200: obj({
            clubs: arr(
              obj(clubViewSchema)
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

      const clubs = await app.m.find(Club, {
        order: {id: 'DESC'},
        take: pagination.take,
        skip: pagination.skip,
      });

      resp.send({
        clubs,
        pagination
      });
    });

    router.get('/slug/:clubSlug', {
      schema: {
        description: 'Show club by slug',
        // response: {
        //   200: obj(clubResponseSchema)
        // }
      },
    }, async (req, resp) => {
      const slug = req.params.clubSlug;
      const user = await app.auth.getUser(req);

      const club = await app.m.findOne(Club, {where: {slug}});

      const me = await app.MeInClubService.meInClub(user, club);

      if (club) {
        resp.send({
          me,
          club
        });
      } else {
        resp.code(StatusCodes.NOT_FOUND).send({
          error: 'Club is not found'
        });
      }
    });

    router.get('/:clubId', {
      schema: {
        description: 'Show club',
        // response: {
        //   200: obj(clubResponseSchema)
        // }
      },
    }, async (req, resp) => {
      const clubId = req.params.clubId;

      const club = await app.m.findOne(Club, {where: {id: clubId}});

      if (club) {
        resp.send({
          club
        });
      } else {
        resp.code(StatusCodes.NOT_FOUND).send({
          error: 'Club is not found'
        });
      }
    });

    router.get('/:clubId/me', {
      schema: {
        description: 'Me in club',
        // response: {
        //   200: obj(clubResponseSchema)
        // }
      },
    }, async (req, resp) => {
      const clubId = req.params.clubId;

      const club = await app.m.findOne(Club, {
        where: {id: clubId}
      });

      if (club) {
        resp.send({
          club
        });
      } else {
        resp.code(StatusCodes.NOT_FOUND).send({
          error: 'Club is not found'
        });
      }
    });

    // router.post('/', {
    //   schema: {
    //     description: 'Create club',
    //     body: obj({
    //       club: obj(clubModifySchema)
    //     }),
    //     response: {
    //       200: obj(clubResponseSchema)
    //     }
    //   },
    // }, async (req, resp) => {
    //   const user = await app.auth.getUser(req.session)
    //   if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});
    //
    //   const clubData = req.body.club;
    //
    //   app.modelHooks.beforeCreate('club', clubData);
    //
    //   const club = app.m.create(Club, {
    //     ...clubData,
    //     user,
    //   });
    //   await app.m.save(club);
    //
    //   app.modelHooks.afterCreate('club', club);
    //
    //   resp.send({
    //     club
    //   });
    // });
    //
    // router.put('/:clubId', {
    //   schema: {
    //     description: 'Update club',
    //     body: obj({
    //       club: obj(clubModifySchema)
    //     }),
    //     response: {
    //       200: obj(clubResponseSchema)
    //     }
    //   },
    // }, async (req, resp) => {
    //   const clubId = req.params.clubId;
    //
    //   const user = await app.auth.getUser(req.session)
    //   if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});
    //
    //   const club = await app.m.findOne(Club, {id: clubId});
    //
    //   if (!club) {
    //     return resp.code(StatusCodes.NOT_FOUND).send({
    //       error: 'Club is not found'
    //     });
    //   }
    //
    //   const clubData = req.body.club;
    //
    //   const prevData = {...club};
    //   app.modelHooks.beforeUpdate('club', {...clubData, id: clubId}, prevData);
    //
    //   Object.assign(club, clubData);
    //
    //   await app.m.save(club);
    //
    //   app.modelHooks.afterUpdate('club', club, prevData);
    //
    //   resp.send({
    //     club
    //   });
    // });

    next();
  }

  // todo: DELETE
}
