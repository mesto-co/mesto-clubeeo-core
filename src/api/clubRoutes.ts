import App from '../App';
import {simplePaginator} from '../lib/crudHelpers';
import {StatusCodes} from 'http-status-codes';
import {arr, enumStr, id, int, nullable, obj, str} from 'json-schema-blocks';
import Club from '../models/Club';
import Session from '../models/Session';
import SessionKey from '../models/SessionKey'
import ClubRole from '../models/ClubRole'
import User from '../models/User'
import {IsNull, Not} from 'typeorm'
import ClubBadge, {BadgeType} from '../models/ClubBadge'

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
    rarible: str(),
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
  ...clubBaseSchema,
}

// response schema
export const clubViewSchema = {
  id: str(1),
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
              obj(clubViewSchema),
            ),
            pagination: obj({
              page: id(),
              take: int(1, 1000),
              skip: id(),
            }),
          }),
        },
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
        pagination,
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

      if (club) {
        const sessionHeader = req.headers['x-clubeeo-session'];
        let sessionData: {
          sessionId: string
          query: Record<string, string>
        } = null;
        try {
          sessionData = sessionHeader ? JSON.parse(sessionHeader) : null;
        } catch (e) {
          //
        }

        if (sessionData && sessionData.sessionId) {
          const session = await app.em.findOneOrCreateBy(Session, {
            user: user ? {id: user.id} : null,
            club: {id: club.id},
            sessionId: sessionData.sessionId,
          }, {
            data: sessionData.query,
          });

          if (session.isCreated) {
            for (const [key, value] of Object.entries(sessionData.query || {})) {
              await app.em.findOneOrCreateBy(SessionKey, {
                user: user ? {id: user.id} : null,
                club: {id: club.id},
                session: {id: session.value.id},
                key,
                value,
              }, {})
            }
          }
        }
      }

      const me = await app.MeInClubService.meInClub(user, club);

      if (club) {
        resp.send({
          me,
          club,
        });
      } else {
        resp.code(StatusCodes.NOT_FOUND).send({
          error: 'Club is not found',
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
          club,
        });
      } else {
        resp.code(StatusCodes.NOT_FOUND).send({
          error: 'Club is not found',
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
        where: {id: clubId},
      });

      if (club) {
        resp.send({
          club,
        });
      } else {
        resp.code(StatusCodes.NOT_FOUND).send({
          error: 'Club is not found',
        });
      }
    });

    router.get('/:clubLocator/roles', {
      schema: {
        response: {
          200: obj({
            roles: arr(obj({
              id: str(1),
              name: str(),
            })),
          }),
        },
      },
    }, async (req, resp) => {
      const cMember = await app.auth.getUserInClubContext(req);
      await cMember.requireRole('admin');

      const club = cMember.club;

      const roles = await app.m.find(ClubRole, {
        where: {
          club: {id: club.id},
        },
        order: {
          name: 'ASC',
        },
      });

      resp.send({
        roles,
      });
    });

    router.get('/:clubLocator/badges', {
      schema: {
        response: {
          200: obj({
            badges: arr(obj({
              id: str(1),
              name: str(),
              description: str(),
              slug: str(),
              badgeType: enumStr(...Object.keys(BadgeType)),
              img: str(),
              style: obj({}, {additionalProperties: true})
            })),
          }),
        },
      },
    }, async (req, resp) => {
      const cMember = await app.auth.getUserInClubContext(req);
      await cMember.requireRole('admin');

      const club = cMember.club;

      const badges = await app.m.find(ClubBadge, {
        where: {
          club: {id: club.id},
        },
        order: {
          name: 'ASC',
        },
      });

      resp.send({
        badges,
      });
    });

    next();
  }
}
