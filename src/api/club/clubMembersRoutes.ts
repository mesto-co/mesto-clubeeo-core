import App from '../../App';
import {arr, enumStr, id, int, nullable, num, obj, str} from 'json-schema-blocks'
import ClubRole from '../../models/ClubRole'
import MemberRole from '../../models/MemberRole'
import ClubBadge, {BadgeType} from '../../models/ClubBadge'
import MemberBadge from '../../models/MemberBadge'

const memberResponseSchema = obj({
  user: obj({
    id: str(1),
    email: str(),
    imgUrl: str(),
    screenName: str(),
    timezone: str(),
    userClubRoles: arr(
      obj({
        clubRole: nullable(obj({
          id: str(1),
          name: str(),
          // clubRole
        })),
      }),
    ),
    badges: arr(
      obj({
        id: str(1),
        index: int(),
        value: int(),
        clubBadge: obj({
          id: str(1),
          name: str(),
          description: str(),
          slug: str(),
          img: str(),
          badgeType: enumStr(...Object.keys(BadgeType)),
          style: obj({}, {additionalProperties: true}),
        }),
      }),
    ),
  }),
  club: obj({
    id: str(1),
    slug: str(),
  }),
});

export default function (app: App) {
  return function (router, opts, next) {

    router.get('/:memberLocator', {
      schema: {
        response: {
          200: memberResponseSchema,
        },
      },
    }, async (req, resp) => {
      const {memberLocator} = req.params;
      const memberCtx = await app.auth.getUserInClubContext(req);
      const {value: authMember} = await memberCtx.fetchMember();
      await memberCtx.assertCanViewMemberData({member: authMember});
      const club = memberCtx.club;

      const member = await app.repos.member.findByLocator(memberLocator, club);
      const user = member.user;

      const roles = await app.m.find(MemberRole, {
        where: {
          member: {id: member.id},
          enabled: true,
        },
        relations: {
          clubRole: true
        }
      });
      const badges = await app.m.find(MemberBadge, {
        where: {
          member: {id: member.id},
        },
        relations: {
          clubBadge: true,
        }
      });

      resp.send({
        user: {
          ...user,
          userClubRoles: roles,
          badges,
        },
        member: {
          ...member,
          roles,
          badges,
        },

        club,
      });
    });

    router.get('/me', {
      schema: {
        response: {
          200: memberResponseSchema,
        },
      },
    }, async (req, resp) => {
      const cMember = await app.auth.getUserInClubContext(req);
      const club = cMember.club;
      const authUser = cMember.user;

      const user = await app.repos.user.findWithRolesAndBadges({user: authUser, club});

      resp.send({
        user,
        club,
      });
    });

    router.post('/:memberLocator/roles', {
      schema: {
        params: obj({
          clubLocator: str(1),
          memberLocator: str(1),
        }),
        body: obj({
          roles: obj({}, {additionalProperties: true}),
        }),
      },
    }, async (req, reply) => {
      const cMember = await app.auth.getUserInClubContext(req);
      await cMember.requireRole('admin');
      const club = cMember.club;

      const member = await app.repos.member.findByLocator(req.params.memberLocator, club);

      for (const [roleId, roleEnabled] of Object.entries(req.body.roles)) {
        const clubRole = await app.m.findOneByOrFail(ClubRole, {
          id: roleId,
          club: {id: cMember.club.id},
        });

        if (roleEnabled) {
          await app.engines.roleEngine.grantRole({
            member, clubRole,
          });
        } else {
          await app.engines.roleEngine.removeRole({
            member, clubRole,
          });
        }
      }

      reply.send({
        ok: true,
      });
    });

    router.post('/:memberLocator/assignBadge', {
      schema: {
        params: obj({
          clubLocator: str(1),
          memberLocator: str(1),
        }),
        body: obj({
          badge: obj({
            id: str(1),
            value: num(),
          }, {optional: ['value']}),
        }),
      },
    }, async (req, reply) => {
      const cMember = await app.auth.getUserInClubContext(req);
      await cMember.requireRole('admin');
      const club = cMember.club;

      const member = await app.repos.member.findByLocator(req.params.memberLocator, club);

      const badge = await app.m.findOneByOrFail(ClubBadge, {
        id: req.body.badge.id,
        club: {id: club.id},
      });

      const result = await app.engines.badgeEngine.grantBadgeToMember(member, badge, {value: req.body.badge.value});

      reply.send(result);
    });

    next();
  }
}
