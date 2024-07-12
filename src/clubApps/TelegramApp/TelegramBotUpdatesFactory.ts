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
import {TelegramEventCodes} from './lib/telegramConsts'
import Club from '../../models/Club'
import {botMemberEvents} from './events/botMemberEvents'
import {botCommandEvents} from './events/botCommandEvents'
import {Not} from 'typeorm'
import { fetchUserAndExtByExtId } from '../../contexts/UserExtContext'

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
        botMemberEvents: botMemberEvents(app),
        botCommandEvents: botCommandEvents(app),

        tgCheckKey: (key: string) => key === app.Env.tgToken,

        approveChatJoinRequest: async (tgChatId: number, tgUserId: number) => {
          try {
            await app.log.info('approveChatJoinRequest:start', {
              data: {tgChatId, tgUserId}
            });

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

              await app.log.info('unbanChatMember', {
                data: {tgChatId, tgUserId, result}
              });

              tgUserState.isBanned = false;
            }

            await app.m.save(tgUserState);

            const result = await c.Telegram.approveChatJoinRequest(tgChatId, tgUserId);

            await app.log.info('approveChatJoinRequest', {
              data: {tgChatId, tgUserId, result}
            });
          } catch (e) {
            await app.log.error(e.message, {data: {error: e.toString(), tgChatId, tgUserId}});
          }
        },

        declineChatJoinRequest: async (tgChatId: number, tgUserId: number) => {
          try {
            await app.log.info('declineChatJoinRequest:start', {
              data: {tgChatId, tgUserId}
            });

            const result = await c.Telegram.declineChatJoinRequest(tgChatId, tgUserId);

            await app.log.info('declineChatJoinRequest', {
              data: {tgChatId, tgUserId, result}
            });
          } catch (e) {
            await app.log.error(e.message, {data: {error: e.toString(), tgChatId, tgUserId}});
          }
        },

        isUserAllowed: async (tgChatId: number, tgUserId: number) => {
          try {
            const user = await app.repos.user.findUserByExtId(ExtService.tg, tgUserId);
            if (!user) {
              await app.log.warn('telegram: isUserAllowed called for unknown user', {data: {tgChatId, tgUserId}});
              return false;
            }

            // const club = await app.ClubRepo.findClubByExtId(ClubExtService.tg, tgChatId);
            // if (!club) return false;

            const clubExt = await app.m.findOne(ClubExt, {
              where: {service: ExtService.tg, extId: String(tgChatId)},
              order: {id: 'DESC'},
              relations: ['club', 'clubApp'],
            });
            const club = clubExt?.club;
            if (!club) {
              await app.log.warn('telegram: isUserAllowed called for unknown chat', {data: {tgChatId, tgUserId}});
              return false;
            }

            // const version = club.settings['version'] || 0;

            // if (version < 2) {
            //   // check by badge
            //   const clubApp = clubExt.clubApp;
            //   if (clubApp) {
            //     const badgeSlug = clubApp.config['badgeSlug'];
            //     if (badgeSlug) {
            //       const hasBadge = await app.engines.badgeEngine.hasBadgeBySlug(user, club, badgeSlug);
            //       if (hasBadge) {
            //         app.log.info('allowed_by_badge', {data: {userId: user.id, clubId: club.id, badgeSlug}});
            //         return true;
            //       }
            //     }
            //   }

            //   return await app.contexts.userInClub(user, club).isMember();
            // } else {

            const clubApp = clubExt.clubApp;
            if (clubApp) {
              return await app.engines.accessEngine.userHasAccessToApp(user, clubApp);
            }
            return false;
          } catch (e) {
            await app.log.error(e.message, {data: {error: e.toString(), tgChatId, tgUserId}});
            return false;
          }
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
        //
        // botPromotedToAdmin: async (data: {tgUserId: number}) => {
        //   const user = await app.repos.user.findUserByExtId(ExtService.tg, data.tgUserId);
        //
        //   const memberCtx = await app.contexts.user(user).inActiveClubContext();
        //   if (!await memberCtx.hasRole('admin')) {
        //     // await
        //   }
        //
        //   // if ()
        //   // const clubExt = await app.m.find(ClubExt);
        // },

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
            // const user = extCode.user;

            // todo: make optional for non-Telegram users

            // // another telegram account bound to the same user
            // const existingUserExt = await app.m.findOneBy(UserExt, {
            //   service: ExtService.tg,
            //   user: {id: extCode.user.id},
            //   extId: Not(String(data.tgUserId)),
            //   enabled: true,
            // });
            // if (existingUserExt) {
            //   existingUserExt.enabled = false;
            //   await app.m.save(existingUserExt);
            // }

            // // same telegram account bound to the other user
            // let prevUserExt = await app.m.findOne(UserExt, {
            //   where: {
            //     service: ExtService.tg,
            //     extId: String(data.tgUserId),
            //     enabled: true,
            //   }
            // });
            // if (prevUserExt) {
            //   prevUserExt.enabled = false;
            //   await app.m.save(prevUserExt);
            // }

            const {userExt, user} = await fetchUserAndExtByExtId(app, {
              service: ExtService.tg,
              extId: String(data.tgUserId),
              userData: data.data.from,
              sourceData: data.data,
            });

            const tgUser = data.data.from;

            //todo: process using event bus
            await app.repos.user.defaultScreenName(user, {
              screenName: tgUser.username,
              firstName: tgUser.first_name,
              lastName: tgUser.last_name,
            });

            // create new loginConfirmed code
            await app.em.createAndSave(ExtCode, {
              code: extCode.code,
              user: {id: user.id},
              club: {id: extCode.clubId},
              service: ExtService.tg,
              codeType: ExtCodeTypes.loginConfirmed,
              used: false,
            });

            await app.engines.motionEngine.processEvent(TelegramEventCodes['telegram:signIn'], {club, user}, {
              userExt,
              tgUser,
              // prevUserExt,
              // isUserExtCreated,
            });

            // todo: remove prevUserExt
            return {loggedIn: true, club, user, prevUserExt: null};
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

        switchUserClub: async (data: { clubSlug: string, tgUserId: number, tgChatId: number }): Promise<Club> => {
          const club = await app.repos.club.findBySlug(data.clubSlug);
          const user = await app.repos.user.findUserByExtId(ExtService.tg, data.tgUserId);

          if (club && user) {
            const userCtx = await app.contexts.user(user);
            await userCtx.setActiveClub(club);
          }

          return club;
        },

        clubBySlug: async (data: { clubSlug: string }): Promise<Club> => {
          return await app.repos.club.findBySlug(data.clubSlug);
        },

        activateClub: async (message: Message.TextMessage, code: string) => {
          const chatId = message.chat.id;

          return await extActivationLogic(
            code, ExtService.tg, String(chatId),
            {
              repos: app.repos,
              async onActivated(extCode, data) {
                const club = await app.repos.club.findById(extCode.clubId);
                const user = await app.repos.user.findById(extCode.userId);

                await app.engines.motionEngine.processEvent(
                  TelegramEventCodes['telegram:botActivated'], {club, user}, {
                    extCode,
                    data,
                  });
              },
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
