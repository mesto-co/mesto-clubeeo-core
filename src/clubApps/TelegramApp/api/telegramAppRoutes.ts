import App from '../../../App';
import {obj, str} from 'json-schema-blocks';
import {StatusCodes} from 'http-status-codes'
import ClubExt from '../../../models/ClubExt';
import { ExtServicesEnum } from '../../../lib/enums';
import { In } from 'typeorm';

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/exts', {
      params: obj({
        clubId: str(1),
        appId: str(1),
      }),
    }, async (request, reply) => {
      const memberCtx = await app.auth.getUserInClubContext(request);
      const {club} = memberCtx;
      const {value: member} = await memberCtx.fetchMember();

      const clubApp = await app.repos.clubApp.findById(club, request.params.appId);
      if (!clubApp || !await app.engines.accessEngine.memberHasAccessToAppPage(member, clubApp, '')) {
        return reply.code(StatusCodes.FORBIDDEN).send({error: 'access denied'});
      }

      if (clubApp.appName !== 'telegram') return reply.code(StatusCodes.NOT_ACCEPTABLE).send({error: 'wrong app'});

      const exts = await app.m.find(ClubExt, {
        where: {
          club: {id: club.id},
          clubApp: {id: clubApp.id},
          service: In([ExtServicesEnum.tgGroup, ExtServicesEnum.tgChannel]),
        },
        order: {createdAt: 'ASC'},
      });

      const items = [];
      for (const ext of exts) {
        let item = ext;
        if (ext.service === ExtServicesEnum.tgGroup || ext.service === ExtServicesEnum.tgChannel) {
          // get chat info
          if (!ext.cached?.['id']) {
            try {
              const chatInfo = await app.TelegramContainer.Telegram.getChat(ext.extId);
              console.log('chatInfo', chatInfo);
              ext.cached = chatInfo;
              await app.m.save(ext);
            } catch (err) {
              console.error(err);
            }
          }

          const data = ext.cached as any;

          item = Object.assign({}, ext, {
            title: data.title,
            caption: data.type,
            description: data.description,
          });

          items.push(item);
        }
      }

      return {
        items,
      }
    });

    next();
  }

}
