import {IEventInput, IProcessor, ITrigger} from '../lib/ActionBuilderInterfaces'
import _ from 'lodash'

/**
 *
 */
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
      actionType: opts.trigger.actionType,
      data: resultData,
    };
  }
}
