import {IEventInput, IProcessor, ITrigger} from '../lib/ActionBuilderInterfaces'

/**
 * Simple processor - bypasses params from trigger
 */
export class BypassProcessor implements IProcessor {
  slug = 'bypass';

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    return {
      actionType: opts.trigger.actionType,
      data: opts.event.data,
    };
  }
}
