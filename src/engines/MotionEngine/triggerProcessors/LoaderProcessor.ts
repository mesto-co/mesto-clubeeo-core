import {IEventInput, IProcessor, ITrigger} from '../lib/ActionBuilderInterfaces'
import _ from 'lodash'
import { MestoApp as App } from '../../../App'

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

    return {
      actionType: opts.trigger.actionType,
      data: resultData,
    };
  }
}
