import Member from "@/models/Member";
import { ExtServicesEnum, fetchUserAndExtByExtId } from "@/contexts/UserExtContext";
import ExtCode, {ExtCodeTypes} from '@/models/ExtCode';

import { TelegramEngine } from "../TelegramEngine";

export function botStart(telegramEngine: TelegramEngine) {
  const c = telegramEngine.c;
  const bot = telegramEngine.bot;
  const clubId = '1';

  bot.start(async (ctx) => {
    const { userExt, user, isCreated: isUserCreated } = await fetchUserAndExtByExtId(c as any, {extId: ctx.from.id.toString(), service: 'tg', userData: ctx.from});
    const { value: member, isCreated: isMemberCreated } = await c.em.findOneOrCreateBy(Member, {user: {id: user.id}, club: {id: clubId}}, {});
    if (isMemberCreated) {
      await c.engines.access.service.addRole({member, user, hub: {id: clubId}}, 'guest');
    } else {
      const roles = await c.engines.access.service.getRolesMap({member, user, hub: {id: clubId}}, ['guest', 'member', 'applicant', 'rejected']);
      if (!Object.values(roles).some(Boolean)) {
        await c.engines.access.service.addRole({member, user, hub: {id: clubId}}, 'guest');
      }
    }

    let isHandled = false;
    if (ctx.payload) {
      const extCode = await c.m.findOne(ExtCode, {
        where: {
          service: ExtServicesEnum.tg,
          codeType: ExtCodeTypes.login,
          code: ctx.payload,
          used: false,
        },
        relations: {user: true, club: true}
      });

      if (extCode) {
        await ctx.reply(
          await c.t('bot.signin', user.lang, {}, 'Пожалуйста, подтвердите вход в систему'),
          {
            reply_markup: {
              inline_keyboard: [
                [{text: 'Подтвердить вход', callback_data: `signin:${ctx.payload}`}],
                [{text: 'Отмена', callback_data: 'deleteMessage'}],
              ],
            },
          }
        );

        isHandled = true;
      }
    }

    if (!isHandled) {
      // if (isUserCreated || isMemberCreated) {
        ctx.reply(await c.t('bot.start', user.lang, {name: user.screenName}, botStartMessageTemplate), {
          reply_markup: {
            inline_keyboard: [
              [{text: 'Начать', web_app: {url: `${c.Env.siteUrl}/mesto/application`}}],
            ],
          },
        })
      // } else {
      //   ctx.reply(`Привет, ${user.screenName}! 👋`, {
      //     reply_markup: {
      //       inline_keyboard: [
      //         [{text: '📝 Заполнить профиль', web_app: {url: `${c.Env.siteUrl}/mesto/profile/edit`}}],
      //       ],
      //     },
      //   });
      // }
    }
  });
}

const botStartMessageTemplate = 
`Привет, {{name}} 👋 

Я — бот Небот, твой проводник в сообщество Mesto, где предприниматели, стартаперы, специалисты, эксперты и инвесторы объединяются для обмена знаниями и опытом, а также совместного развития. 

Наше сообщество состоит из людей, которые прошли разные этапы создания и масштабирования бизнеса, и здесь каждый может найти поддержку на своём пути.

Чтобы стать частью Mesto, пожалуйста, заполните профиль и нажмите кнопку “Подать заявку”`;