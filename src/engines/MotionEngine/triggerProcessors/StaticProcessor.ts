import {IEventInput, IProcessor, ITrigger} from '../lib/ActionBuilderInterfaces'

/**
 * Simple processor - bypasses params from trigger
 */
export class StaticProcessor implements IProcessor {
  slug = 'static';

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    return {
      actionType: opts.trigger.actionType,
      data: opts.trigger.data,
    };
  }
}
