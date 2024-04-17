import {IEventInput, IProcessor, ITask, ITrigger} from './TaskBuilderInterfaces'
import {VM} from 'vm2'
import _ from 'lodash'
import App from '../../App'
import {ActionBuilderLogic} from './lib/ActionBuilderLogic'
import {ITriggerProcessor} from './lib/ActionBuilderInterfaces'

/**
 * Simple processor - bypasses params from trigger
 */
export class StaticProcessor implements IProcessor {
  slug = 'static';

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    return {
      taskType: opts.trigger.taskType,
      data: opts.trigger.data,
    };
  }
}

export class BypassProcessor implements IProcessor {
  slug = 'bypass';

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    return {
      taskType: opts.trigger.taskType,
      data: opts.event.data,
    };
  }
}

const defaultVmOptions = {
  timeout: 1000,
  allowAsync: false,
}

export class JavaScriptProcessor implements IProcessor {
  slug = 'javascript';

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    const vm = new VM(defaultVmOptions);

    vm.freeze(opts.event.data, 'event');

    let data = vm.run(opts.trigger.processor.opts['code']);

    return {
      taskType: opts.trigger.taskType,
      data,
    };
  }
}

export class MapProcessor implements IProcessor {
  slug = 'map';

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    const resultData = {...opts.trigger.data};

    const mapping = opts.trigger.processor.opts?.map || {};

    for (const k of Object.keys(mapping)) {
      const v = mapping[k];
      if (!v) continue;

      _.set(resultData, k, _.get(opts.event.data, v));
    }

    return {
      taskType: opts.trigger.taskType,
      data: resultData,
    };
  }
}

/**
 *
 */
export class LoaderProcessor implements IProcessor {
  app: App;
  slug = 'loaded';

  constructor(app: App) {
    this.app = app;
  }

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    const resultData = {...opts.trigger.data};

    const mapping = opts.trigger.processor.opts?.map || {};

    const user = await this.app.repos.user.loadBy(opts.event);
    const club = await this.app.repos.club.loadBy(opts.trigger);
    const userInClub = this.app.contexts.userInClub(user, club);

    for (const k of Object.keys(mapping)) {
      const v = mapping[k];
      if (!v) continue;

      if (v.startsWith('wallet.')) {
        const wallet = await userInClub.getMainWallet();
        _.set(resultData, k, _.get({wallet}, v));
      }
    }

    return {
      taskType: opts.trigger.taskType,
      data: resultData,
    };
  }
}

/**
 *
 */
export class LegacyMergeProcessor implements IProcessor {
  slug = 'merge';
  taskBuilder: TaskBuilderLogic;

  constructor(taskBuilder: TaskBuilderLogic) {
    this.taskBuilder = taskBuilder;
  }

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    const steps = opts.trigger.processor.opts?.steps || [] as Array<ITriggerProcessor>;

    let data = {};
    for (const step of steps) {
      const result = await this.taskBuilder.buildTask({
        trigger: {
          ...opts.trigger,
          processor: step,
        },
        event: opts.event,
      });

      _.merge(data, result.data);
    }

    return {
      taskType: opts.trigger.taskType,
      data,
    };
  }
}

export const taskBuilder = (app: App) => new TaskBuilderLogic({
  processors: {
    static: new StaticProcessor(),
    bypass: new BypassProcessor(),
    javascript: new JavaScriptProcessor(),
    map: new MapProcessor(),
    loader: new LoaderProcessor(app),
  }
});

export class TaskBuilderLogic {
  protected processors: Record<string, IProcessor>

  constructor(deps: {processors: Record<string, IProcessor>}) {
    this.processors = deps.processors;
  }

  register(slug: string, processor: IProcessor) {
    this.processors[slug] = processor;
  }

  async buildTask(opts: { trigger: ITrigger, event: IEventInput }): Promise<ITask> {
    const processorType = opts.trigger?.processor?.type;
    const processor = this.processors[processorType];
    if (!processor) throw Error(`processor ${processorType} is not found`);

    const result = await processor.exec({ ...opts, config: opts.trigger?.processor || {}}); //opts.eventInput.data

    return {
      taskType: result.taskType,
      data: result.data,
    }
  }
}
