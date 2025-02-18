import App from '../App';
import {simplePaginator} from '../lib/crudHelpers';
import {StatusCodes} from 'http-status-codes';
import {arr, enumStr, id, int, nullable, obj, str} from 'json-schema-blocks';
import Club from '../models/Club';
import Session from '../models/Session';
import SessionKey from '../models/SessionKey'
import ClubRole from '../models/ClubRole'
import User from '../models/User'
import {IsNull, Not} from 'typeorm'
import ClubBadge, {BadgeType} from '../models/ClubBadge'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/config', {
      schema: {
        description: 'Global config',
      },
    }, async (req, resp) => {
      resp.send({
        config: app.Env.globalConfig,
      });
    });

    next();
  }
}
