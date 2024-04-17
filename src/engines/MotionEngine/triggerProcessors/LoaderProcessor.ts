import {IEventInput, IProcessor, ITrigger} from '../lib/ActionBuilderInterfaces'
import _ from 'lodash'
import App from '../../../App'

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
      actionType: opts.trigger.actionType,
      data: resultData,
    };
  }
}
