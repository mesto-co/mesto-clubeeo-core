import {IEventInput, IProcessor, ITrigger} from '../lib/ActionBuilderInterfaces'
import {VM} from 'vm2'

const defaultVmOptions = {
  timeout: 1000,
  allowAsync: false,
}

/**
 * Simple processor - bypasses params from trigger
 */
export class JavaScriptProcessor implements IProcessor {
  slug = 'javascript';

  async exec(opts: { trigger: ITrigger, event: IEventInput }) {
    const vm = new VM(defaultVmOptions);

    vm.freeze(opts.event.data, 'event');

    let data = vm.run(opts.trigger.processor.opts['code']);

    return {
      actionType: opts.trigger.actionType,
      data,
    };
  }
}
