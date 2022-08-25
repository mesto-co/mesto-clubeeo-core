import * as tt from 'telegraf/src/telegram-types'
import {CallbackQuery} from 'typegram/markup'
import {ISignInUserResult, TelegramBotUpdates} from './TelegramBotUpdates'
import TgUserState from '../../models/TgUserState'
import UserExt from '../../models/UserExt'
import ClubExt from '../../models/ClubExt'
import TgBotState from '../../models/TgBotState'
import ExtCode, {ExtCodeTypes} from '../../models/ExtCode'
import {TelegramContainer} from './TelegramContainer'
import {Message} from 'typegram/message'
import {extActivationLogic} from '../../logic/ExtActivationLogic'
import {ExtService} from '../../lib/enums'

export class TelegramBotUpdatesFactory {
  protected c: TelegramContainer

  constructor(c: TelegramContainer) {
    this.c = c;
  }

  build(): TelegramBotUpdates {
    const c = this.c;
    const app = this.c.app;

    return new TelegramBotUpdates({
      app,
      ports: {
        tgCheckKey: (key: string) => key === app.Env.tgToken,

        approveChatJoinRequest: async (tgChatId: number, tgUserId: number) => {
          // const telegramApp = new TelegramApp({app});
          //
          // await telegramApp.enableUser({});

          let tgUserState = await app.m.findOneBy(TgUserState, {
            tgChatId,
            tgUserId,
          });

          if (!tgUserState) {
            tgUserState = app.m.create(TgUserState, {
              tgChatId, tgUserId,
              isBanned: false,
            });
          } else if (tgUserState?.isBanned) {
            // unban user if user is already banned to allow enter the chat
            const result = await c.Telegram.unbanChatMember(tgChatId, tgUserId);

            app.log.info('unbanChatMember', {
              data: {tgChatId, tgUserId, result}
            });

            tgUserState.isBanned = false;
          }

          await app.m.save(tgUserState);

          const result = await c.Telegram.approveChatJoinRequest(tgChatId, tgUserId);

          app.log.info('approveChatJoinRequest', {
            data: {tgChatId, tgUserId, result}
          });
        },

        declineChatJoinRequest: async (tgChatId: number, tgUserId: number) => {
          const result = await c.Telegram.declineChatJoinRequest(tgChatId, tgUserId);

          app.log.info('declineChatJoinRequest', {
            data: {tgChatId, tgUserId, result}
          });
        },

        isUserAllowed: async (tgChatId: number, tgUserId: number) => {
          const user = await app.UserRepo.findUserByExtId(ExtService.tg, tgUserId);
          if (!user) return false;

          // const club = await app.ClubRepo.findClubByExtId(ClubExtService.tg, tgChatId);
          // if (!club) return false;

          const clubExt = await app.m.findOne(ClubExt, {
            where: {service: ExtService.tg, extId: String(tgChatId)},
            order: {id: 'DESC'},
            relations: ['club', 'clubApp'],
          });
          const club = clubExt?.club;
          if (!club) return false;

          return await app.contexts.userInClub(user, club).isMember();
        },

        tgChatStateUpdated: async (data: {tgChatId: number, status: string}) => {
          let tgBotState = await app.m.findOneBy(TgBotState, {tgChatId: data.tgChatId});

          if (!tgBotState) {
            tgBotState = app.m.create(TgBotState, {
              tgChatId: data.tgChatId,
            });
          }

          tgBotState.status = data.status;

          await app.m.save(tgBotState);
        },

        signInUser: async (data: {tgUserId: number, code: string, data: CallbackQuery}): Promise<ISignInUserResult> => {
          const extCode = await app.m.findOne(ExtCode, {
            where: {
              service: ExtService.tg,
              codeType: ExtCodeTypes.login,
              code: data.code,
              used: false,
            },
            relations: {user: true, club: true}
          });

          if (!extCode) {
            app.consoleLogger.info('signInUser: extCode is not found', {data: data});
          }

          if (extCode) {
            extCode.used = true;
            await app.m.save(extCode);

            const club = extCode.club;
            const user = extCode.user;

            const existedUserExt = await app.m.findOneBy(UserExt, {
              service: ExtService.tg,
              user: {id: extCode.user.id},
              enabled: true,
            });
            if (existedUserExt) {
              existedUserExt.enabled = false;
              await app.m.save(existedUserExt);
            }

            const userExt = app.m.create(UserExt, {
              service: ExtService.tg,
              extId: String(data.tgUserId),
              user: {id: extCode.user.id},
              enabled: true,
              data: data.data,
            });
            await app.m.save(userExt);

            const tgUser = data.data.from;

            await app.repos.user.defaultScreenName(user, {
              screenName: tgUser.username,
              firstName: tgUser.first_name,
              lastName: tgUser.last_name,
            });

            return {loggedIn: true, club, user};
          } else {
            return {loggedIn: false};
          }
        },

        sendMessage: async (
          chatId: number | string,
          text: string,
          extra?: tt.ExtraReplyMessage
        ) => {
          return await c.Telegram.sendMessage(chatId, text, extra);
        },

        activateClub: async (message: Message.TextMessage, code: string) => {
          const chatId = message.chat.id;
          return await extActivationLogic(
            code, ExtService.tg, String(chatId),
            {
              repos: app.repos,
              async reply(text: string) {
                return await c.Telegram.sendMessage(chatId, text);
              }
            }
          )
        }
      }
    });
  }
}
