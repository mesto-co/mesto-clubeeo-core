import User from '../../models/User'
import UserExt from '../../models/UserExt'
import {StatusCodes} from 'http-status-codes'
import {EntityManager} from 'typeorm'
import {TgAuthCheck} from '../../clubApps/TelegramApp/lib/TgAuthCheck'
import {ExtServicesEnum} from '../../lib/enums'
import ExtCode from '../../models/ExtCode'
import App from '../../App'

// export interface ITelegramAuthApp<TUser> {
//   Env: {
//     tgToken: string
//   },
//   auth: {
//     getUser(session): Promise<TUser>;
//     logIn(userId: string, session);
//     logOut(session);
//   };
//   m: EntityManager;
//   nanoid: (size?: number) => string;
// }

interface TgAuthParams {
  auth_date: number,
  hash: string,
  id: number,
  first_name: string,
  last_name: string,
  photo_url: string,
  username: string,
}

export default function (app: App) {
  return function (router, opts, next) {

    router.post('/code-login', async (req, resp) => {
      const {code} = req.body;

      const loginCode = await app.repos.extCode.useTgLoginCode(code);

      if (loginCode) {
        app.auth.logIn(loginCode.userId, req.session);
        resp.send({ok: true});
      } else {
        resp.send({ok: false});
      }
    });

    router.post('/login', {
      schema: {},
    }, async (req, resp) => {
      const params: TgAuthParams = req.body;
      const user = await app.auth.getUser(req);
      if (!user) {
        return resp.code(StatusCodes.FORBIDDEN).send({
          error: 'Please, login first',
        })
      }

      const tgAuthenticated = TgAuthCheck.checkParams(params, app.Env.tgToken)
      if (!tgAuthenticated) {
        resp.send({
          ok: false,
        })
      } else {
        let userExt = await app.m.findOne(UserExt, {
          where: {
            service: ExtServicesEnum.tg,
            extId: String(params.id),
            enabled: true,
          },
          relations: ['user'],
        });

        if (userExt) {
          if (user.id != userExt.userId) {
            return resp.code(StatusCodes.FORBIDDEN).send({
              error: 'Telegram user is already bound to another account',
            })
          }
        } else {
          userExt = app.m.create(UserExt, {
            service: ExtServicesEnum.tg,
            extId: String(params.id),
            user,
            enabled: true,
          });
        }

        if (!user.screenName) {
          user.screenName = [params.first_name, params.last_name].filter(v=>v).join(' ') || params.username;
          await app.m.save(user);
        }

        userExt.data = params;

        await app.m.save(userExt);

        resp.send({
          ok: true,
        })
      }
    });

    next();

  }
}
