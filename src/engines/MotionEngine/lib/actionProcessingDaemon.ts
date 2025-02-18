import { MestoApp as App } from '../../../App'
import ActionProcessDaemonLogic, {IActionResult, TActionProcessor} from '../lib/ActionProcessDaemonLogic'
import MotionAction, {MotionActionState} from '../models/MotionAction'
import {appRegistry} from '../../AppsEngine/AppsRegistry'
import ClubApp from '../../AppsEngine/models/ClubApp'
import Member from '../../../models/Member'

export const actionProcessingDaemon = (app: App) => {
  new ActionProcessDaemonLogic(
    {
      log: app.log,

      lockNextAction: async (taskTypes?: Array<string>) => {
        // const taskTypesRaw = `'${taskTypes.join("','")}'`;

        const actions: { raw: Array<{ id: string }> } = await app.DB
          .createQueryBuilder()
          .update(MotionAction)
          .set({
            state: MotionActionState.processing,
            lockedAt: () => "CURRENT_TIMESTAMP",
          })
          .where(
            `id IN (SELECT id FROM "motion_action" WHERE`
            + ` "state" = ${MotionActionState.pending}`
            + ` LIMIT 1)`,
          )
          .returning('id')
          .execute();

        // + ` AND "actionType" IN (${taskTypesRaw})`

        if (actions.raw.length == 0) {
          return null;
        }

        const actionId = actions.raw[0].id;

        const action = await app.m.findOne(MotionAction, {
          where: {
            id: actionId,
          },
        });

        return action;
      },

      getActionProcessor: async (action): Promise<TActionProcessor> => {
        const clubApp = await app.m.findOne(ClubApp, {
          where: {id: action.clubAppId},
          relations: {club: true},
        });
        const club = clubApp.club;

        const clubAppConfig = clubApp.appName ? appRegistry[clubApp.appName] : null;
        if (clubAppConfig) {
          const actionConfig = clubAppConfig.actions[action.actionType];

          if (actionConfig) {
            if (!actionConfig.call) return null;

            const member = await app.m.findOneByOrFail(Member, {
              id: action.memberId,
              club: {id: club.id},
            });

            const emit = async (event: string, data: Record<string, unknown>): Promise<void> => {
              await app.engines.motionEngine.processEvent(event, {
                club, clubApp, member,
              }, data);
            }

            return async (action: MotionAction): Promise<IActionResult> => {
              const result = await actionConfig.call({
                app, club, clubApp, member, action, emit, caller: 'action',
              }, action.data);

              return result;

              // return {
              //   state: MotionActionState.done,
              //   data: {
              //     result,
              //   },
              // }
            }
          }
        }
      },

      unlockAction: async (task: MotionAction, actionResult: IActionResult) => {
        const setData = {
          state: actionResult.state,
        }
        if (actionResult.state === MotionActionState.done) {
          setData['doneAt'] = () => "CURRENT_TIMESTAMP";
          setData['result'] = actionResult.data;
        } else if (actionResult.state === MotionActionState.failed) {
          setData['errorAt'] = () => "CURRENT_TIMESTAMP";
          setData['result'] = {...actionResult.data || {}, error: actionResult.error};
        }

        const tasks: { raw: Array<{ id: number }> } = await app.DB
          .createQueryBuilder()
          .update(MotionAction)
          .set(setData)
          .where(
            `"id" = ${task.id}`
            + ` AND "state" = ${MotionActionState.processing}`,
          )
          .returning('id')
          .execute();

        if (tasks.raw.length == 0) {
          app.log.warn('queue daemon: no task to unlock', {data: {task, taskResult: actionResult}});
        }
      },
    },

    {
      interval: app.Env.taskProcessingInterval, //todo: move to engine!
    },
  ).run();
}
