import MotionEngine from '../MotionEngine'
import Trigger from '../../../models/Trigger'
import {JSONObject} from '../../../lib/common'
import {bool, id, obj, str} from 'json-schema-blocks'
import ClubApp from '../../AppsEngine/models/ClubApp'
import MotionTrigger from '../models/MotionTrigger'

const serializeTrigger = (trigger: MotionTrigger) => {
  return {
    ...trigger,
    processingType: trigger.processor.type,
    sourceApp: trigger.eventClubAppId,
    targetApp: trigger.actionClubAppId,
  }
}

interface ITriggerRequestData {
  name: string,

  sourceApp: number,
  eventType: string,
  eventProps: Record<string, string>,

  targetApp: number,
  actionType: string,
  actionProps: Record<string, string>,

  processingType: string,
  processingData: JSONObject,
  processingOpts: Record<string, any>,

  enabled: boolean,
}

const deserializeTrigger = (data: ITriggerRequestData) => {
  const {
    name,
    eventType, eventProps,
    actionType, actionProps,
    processingType, processingData, processingOpts,
  } = data;

  return {
    name,

    eventType,
    eventProps,

    actionType,
    actionProps,

    processor: {
      type: processingType,
      opts: processingOpts,
    },

    data: processingData,
  }
}

export default function (c: MotionEngine) {
  return function (router, opts, next) {
    router.get('/triggers', async function (req, reply) {
      const memberCtx = await c.app.auth.getUserInClubContext(req);
      await memberCtx.requireRole('admin');
      const club = memberCtx.club;

      const triggers = await c.app.m.find(MotionTrigger, {
        where: {
          club: {id: club.id},
        },
        order: {
          id: 'DESC',
        },
      });

      reply.send({
        ok: true,
        triggers: triggers.map(trigger => serializeTrigger(trigger)),
      });
    });

    router.get('/trigger/:triggerId', async function (req, reply) {
      const memberCtx = await c.app.auth.getUserInClubContext(req);
      await memberCtx.requireRole('admin');
      const club = memberCtx.club;
      const triggerId = req.params.triggerId;

      const trigger = await c.app.m.findOneByOrFail(MotionTrigger, {
        id: triggerId,
        club: {id: club.id},
      });

      reply.send({
        ok: true,
        trigger: serializeTrigger(trigger),
      });
    });

    router.post('/trigger/dry-run', {
      // schema: {
      //   eventType: `${eventType.value.value}:${eventType.value.value}`,
      //   taskType: `${taskTarget.value.value}:${taskType.value.value}`,
      //   processingType: processingType.value.value,
      //   processingOpts: {
      //     code: processingCode.value,
      //   },
      //   testEventData: testEventData.value,
      // }
    }, async function (req, reply) {
      const memberCtx = await c.app.auth.getUserInClubContext(req);
      await memberCtx.requireRole('admin');
      const club = memberCtx.club;

      const {
        eventType, taskType, processingType, processingData, processingOpts, testEventData,
      } = req.body as {
        eventType: string,
        taskType: string,
        processingType: string,
        processingData: JSONObject,
        processingOpts: Record<string, any>,
        testEventData: string // | Record<string, string>,
      };

      const data = await c.taskBuilder.buildTask({
        trigger: {
          taskType,
          processor: {
            type: processingType,
            opts: processingOpts,
          },
          clubId: memberCtx.club.id,
          data: processingData,
        },
        event: {
          data: JSON.parse(testEventData),
          userId: memberCtx.user.id,
        },
      });

      // if (taskData.data !== null) {
      //   const taskProcessor = this.deps.taskProcessors[taskType];
      //
      //   const result = await taskProcessor(task);
      // }

      reply.send({
        ok: true,
        data: data.data,
        taskType,
      });
    });

    router.post('/trigger', {
      schema: {
        body: obj({
          name: str(1),

          sourceApp: str(1),
          eventType: str(1),
          eventProps: obj({}, {additionalProperties: true}),

          targetApp: str(1),
          actionType: str(1),
          actionProps: obj({}, {additionalProperties: true}),

          processingType: str(1),
          processingOpts: obj({}, {additionalProperties: true}),
          processingData: obj({}, {additionalProperties: true}),

          enabled: bool(),
        }),
      },
    }, async function (req, reply) {
      const memberCtx = await c.app.auth.getUserInClubContext(req);
      await memberCtx.requireRole('admin');
      const club = memberCtx.club;

      const {sourceApp: sourceAppId, targetApp: targetAppId, enabled} = req.body as {
        sourceApp: string,
        targetApp: string,
        enabled: boolean,
      };

      const sourceApp = await c.app.m.findOneByOrFail(ClubApp, {
        id: sourceAppId,
        club: {id: club.id},
      });

      const targetApp = await c.app.m.findOneByOrFail(ClubApp, {
        id: targetAppId,
        club: {id: club.id},
      });

      const trigger = await c.app.em.createAndSave(MotionTrigger, {
        ...deserializeTrigger(req.body),
        eventClubApp: {id: sourceApp.id},
        actionClubApp: {id: targetApp.id},
        club: {id: club.id},
        enabled: enabled || false,
      });

      reply.send({
        ok: true,
        trigger: serializeTrigger(trigger),
      });
    });

    router.put('/trigger/:triggerId', {
      // schema: {
      //   eventType: `${eventType.value.value}:${eventType.value.value}`,
      //   taskType: `${taskTarget.value.value}:${taskType.value.value}`,
      //   processingType: processingType.value.value,
      //   processingOpts: {
      //     code: processingCode.value,
      //   },
      //   testEventData: testEventData.value,
      // }
    }, async function (req, reply) {
      const memberCtx = await c.app.auth.getUserInClubContext(req);
      await memberCtx.requireRole('admin');
      const club = memberCtx.club;
      const triggerId = req.params.triggerId;

      const {sourceApp: sourceAppId, targetApp: targetAppId, enabled} = req.body as {
        sourceApp: string,
        targetApp: string,
        enabled: boolean,
      };

      const sourceApp = await c.app.m.findOneByOrFail(ClubApp, {
        id: sourceAppId,
        club: {id: club.id},
      });

      const targetApp = await c.app.m.findOneByOrFail(ClubApp, {
        id: targetAppId,
        club: {id: club.id},
      });

      const trigger = await c.app.m.findOneByOrFail(MotionTrigger, {
        id: triggerId,
        club: {id: club.id},
      });
      c.app.m.merge(MotionTrigger, trigger, {
        ...deserializeTrigger(req.body),
        eventClubApp: {id: sourceApp.id},
        actionClubApp: {id: targetApp.id},
        club: {id: club.id},
        enabled: enabled,
      });
      await c.app.m.save(trigger);

      reply.send({
        ok: true,
        trigger: serializeTrigger(trigger),
      });
    });

    next();
  }

}
