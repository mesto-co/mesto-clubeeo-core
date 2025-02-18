import { MestoApp as App } from '../../App'
import Club from '../../models/Club'
import Trigger from '../../models/Trigger'
import Event from '../../models/Event'
import User from '../../models/User'
import Task, {TaskState} from '../../models/Task'
import {IEntityId} from '../../lib/common'
import {LegacyMergeProcessor, taskBuilder, TaskBuilderLogic} from './TaskBuilderLogic'
import {BypassProcessor} from './triggerProcessors/BypassProcessor'
import {MapProcessor} from './triggerProcessors/MapProcessor'
import {LoaderProcessor} from './triggerProcessors/LoaderProcessor'
import {MergeProcessor} from './triggerProcessors/MergeProcessor'
import {StaticProcessor} from './triggerProcessors/StaticProcessor'
import motionClubApi from './api/motionAdminApi'
import {JavaScriptProcessor} from './triggerProcessors/JavaScriptProcessor'
import ClubApp from '../AppsEngine/models/ClubApp'
import {actionProcessingDaemon} from './lib/actionProcessingDaemon'
import {IEngineDaemon} from '../../lib/EngineBase/EngineInterfaces'
import MotionAction, {MotionActionState} from './models/MotionAction'
import MotionTrigger from './models/MotionTrigger'
import {ActionBuilderLogic} from './lib/ActionBuilderLogic'
import Member from '../../models/Member'
import {appRegistry} from '../AppsEngine/AppsRegistry'
import { EngineBase } from '../../core/lib/EngineBase'

export default class MotionEngine extends EngineBase implements IEngineDaemon {
  readonly app: App;
  readonly taskBuilder: TaskBuilderLogic;
  readonly actionBuilder: ActionBuilderLogic;

  constructor(app: App) {
    super();

    this.app = app;

    this.actionBuilder = new ActionBuilderLogic({
      processors: {
        static: new StaticProcessor(),
        bypass: new BypassProcessor(),
        javascript: new JavaScriptProcessor(),
        map: new MapProcessor(),
        loader: new LoaderProcessor(app),
      }
    });
    this.actionBuilder.register('merge', new MergeProcessor(this.actionBuilder));

    //todo: remove (is used by aspis & weezi)
    this.taskBuilder = taskBuilder(app);
    this.taskBuilder.register('merge', new LegacyMergeProcessor(this.taskBuilder));
  }

  get api() { return motionClubApi(this) }

  apiConfig = {prefix: '/club/:clubLocator/motion'}

  runDaemon() { actionProcessingDaemon(this.app); }

  // async createUserTrigger(data: {user: User}) {
  //
  // }

  async createClubTrigger(eventType: string, data: {club: Club, taskType: string, name?: string, data?: Record<string, any>}) {
    return await this.app.em.createAndSave(Trigger, {
      eventType,
      club: {id: data.club.id},
      taskType: data.taskType,
      name: data.name || '',
      data: data.data || {},
    });
  }

  async processEvent(eventType: string, opts: {club: Club | IEntityId, user?: User | IEntityId, member?: Member, clubApp?: ClubApp | IEntityId}, data: Record<string, any> = {}) {
    try {
      const eventClubApp = opts.clubApp ? {id: opts.clubApp.id} : null;

      const event = await this.app.em.createAndSave(Event, {
        eventType,
        club: {id: opts.club.id},
        user: opts.user ? {id: opts.user.id} : null,
        clubApp: eventClubApp,
        data,
      });

      const motionTriggerWhere = {
        eventType,
        club: {id: opts.club.id},
        enabled: true,
      }
      if (eventClubApp) motionTriggerWhere['eventClubApp'] = eventClubApp;
      const motionTriggers = await this.app.m.find(MotionTrigger, {
        where: motionTriggerWhere,
        relations: {
          eventClubApp: true,
        }
      });
      for (const trigger of motionTriggers) {
        try {
          const eventClubApp = trigger.eventClubApp;
          const appConfig = appRegistry[eventClubApp.appName];
          const eventConfig = appConfig.events?.[eventType];
          if (eventConfig.guard && !eventConfig.guard({trigger, event})) {
            continue;
          }

          const actionData = await this.actionBuilder.buildAction({
            trigger,
            event,
          });

          // don't create task on null
          if (actionData.data === null) continue;

          // create task for trigger
          await this.app.em.createAndSave(MotionAction, {
            event: {id: event.id},
            trigger: {id: trigger.id},
            club: {id: opts.club.id},
            user: opts.user ? {id: opts.user.id} : null,
            member: opts.member ? {id: opts.member.id} : null,
            actionType: actionData.actionType,
            data: actionData.data,
            actionProps: trigger.actionProps,
            actionClubApp: {id: trigger.actionClubAppId},
            clubApp: trigger.actionClubAppId ? {id: trigger.actionClubAppId} : null,
            state: MotionActionState.pending,
          });
        } catch (e) {
          this.app.log.error('motionEngine:trigger_processing_failed', {
            data: {
              eventType,
              eventOpts: opts,
              trigger,
              error: {message: e.toString(), stack: e.stack}
            }, module: 'motionEngine'
          })
        }
      }

      // todo: get rid of Triggers, replace with MotionTriggers (is used by aspis & weezi)
      const triggerWhere = {
        eventType,
        club: {id: opts.club.id},
        enabled: true,
      }
      if (eventClubApp) triggerWhere['eventClubApp'] = eventClubApp;
      const triggers = await this.app.m.findBy(Trigger, triggerWhere);

      for (const trigger of triggers) {
        try {
          const taskData = await this.taskBuilder.buildTask({
            trigger,
            event,
          });

          // don't create task on null
          if (taskData.data === null) continue;

          // create task for trigger
          await this.app.em.createAndSave(Task, {
            event: {id: event.id},
            trigger: {id: trigger.id},
            club: {id: opts.club.id},
            user: opts.user ? {id: opts.user.id} : null,
            taskType: taskData.taskType,
            data: taskData.data,
            clubApp: trigger.taskClubAppId ? {id: trigger.taskClubAppId} : null,
            state: TaskState.pending,
          });
        } catch (e) {
          this.app.log.error('motionEngine:legacy_trigger_processing_failed', {
            data: {
              eventType,
              eventOpts: opts,
              trigger,
              error: {message: e.toString(), stack: e.stack}
            }, module: 'motionEngine'
          })
        }
      }
    } catch (e) {
      this.app.log.error('motionEngine:event_processing_failed', {
        data: {
          eventType,
          eventOpts: opts,
          error: {message: e.toString(), stack: e.stack}
        }, module: 'motionEngine'
      })
    }
  }

  // async createClubAppTrigger(data: {app: ClubApp, club: Club, eventType: string, name: string}) {
  //
  // }

}
