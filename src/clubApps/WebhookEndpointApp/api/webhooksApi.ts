import {str} from 'json-schema-blocks'
import ClubAppProp from '../../../engines/AppEngine/models/ClubAppProp'
import App from '../../../App'
import Member from '../../../models/Member'

export default function (app: App) {
  const motion = app.engines.motionEngine;

  return function (router, opts, next) {

    router.get('/:hookKey', {
      schema: {
        props: {
          hookKey: str(16),
        },
      },
    }, async function (req, reply) {
      const prop = await app.m.findOne(ClubAppProp, {
        where: {
          appKey: 'webhook-endpoint',
          key: 'url',
          value: req.params.hookKey,
        },
        relations: {
          club: true,
          clubApp: true,
        },
      });
      if (!prop) {
        reply.send({
          error: 'webhook is not found',
        });
        return;
      }

      const memberId = req.query.memberId;
      let member;
      if (memberId) {
        member = await app.m.findOne(Member, {
          where: {
            id: memberId,
            club: {id: prop.clubId},
          },
        });
      }

      await motion.processEvent(
        'webhook:request',
        {
          club: prop.club,
          clubApp: prop.clubApp,
          member,
        },
        {method: 'get', query: req.query, member: {id: member.id}},
      );

      reply.send({
        ok: true,
      });
    });

    router.post('/:hookKey', {
      schema: {
        props: {
          hookKey: str(16),
        },
      },
    }, async function (req, reply) {
      const prop = await app.m.findOne(ClubAppProp, {
        where: {
          appKey: 'webhook-endpoint',
          key: 'url',
          value: req.params.hookKey,
        },
        relations: {
          club: true,
          clubApp: true,
        },
      });
      if (!prop) {
        reply.send({
          error: 'webhook is not found',
        });
        return;
      }

      // if (prop.clubApp.config[]) {
      //
      // }

      const memberId = req.query.memberId || req.body.memberId;
      let member;
      if (memberId) {
        member = await app.m.findOne(Member, {
          where: {
            id: memberId,
            club: {id: prop.clubId},
          },
        });
      }

      await motion.processEvent(
        'webhook:request',
        {
          club: prop.club,
          clubApp: prop.clubApp,
          member,
        },
        {method: 'post', query: req.query, data: req.body, member: {id: member.id}},
      );

      reply.send({
        ok: true,
      });
    });

    // router.post('/:key', async function (req, reply) {
    //   reply.send({ok: true});
    // });

    next();
  }

}
