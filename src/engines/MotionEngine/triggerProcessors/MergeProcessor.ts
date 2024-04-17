import {IEventInput, IProcessor, ITrigger, ITriggerProcessor} from '../lib/ActionBuilderInterfaces'
import _ from 'lodash'
import {ActionBuilderLogic} from '../lib/ActionBuilderLogic'

/**
 *
 */
export class MergeProcessor implements IProcessor {
  slug = 'merge';
  actionBuilder: ActionBuilderLogic;

  constructor(actionBuilder: ActionBuilderLogic) {
    this.actionBuilder = actionBuilder;
  }

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    const steps = opts.trigger.processor.opts?.steps || [] as Array<ITriggerProcessor>;

    let data = {};
    for (const step of steps) {
      const result = await this.actionBuilder.buildAction({
        trigger: {
          ...opts.trigger,
          processor: step,
        },
        event: opts.event,
      });

      _.merge(data, result.data);
    }

    return {
      actionType: opts.trigger.actionType,
      data,
    };
  }
}
