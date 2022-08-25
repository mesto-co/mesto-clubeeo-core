import {Update} from 'telegraf/typings/core/types/typegram';
import {ChatJoinRequest, ChatMemberUpdated} from 'typegram/manage'
import {Message} from 'typegram/message'
import * as tt from 'telegraf/src/telegram-types'
import {Telegram} from 'telegraf/src/core/types/typegram'
import {CallbackQuery} from 'typegram/markup'
import {IHexCommonApp} from '../../hex/HexCommon'
import Club from '../../models/Club'
import User from '../../models/User'
import {ClubContext} from '../../contexts/ClubContext'
import { Env } from '../../env';
import {getCommandAndParam} from './lib/TgParse'
import {ExtCodeRepo} from '../../models/repos/ExtCodeRepo'

export interface ITelegramHexPorts {
  tgCheckKey: (key) => boolean
  approveChatJoinRequest: (tgChatId: number, tgUserId: number) => Promise<void>
  declineChatJoinRequest: (tgChatId: number, tgUserId: number) => Promise<void>
  isUserAllowed: (tgChatId: number, tgUserId: number) => Promise<boolean>
  tgChatStateUpdated: (data: { tgChatId: number, status: string }) => Promise<void>
  signInUser: (data: { code: string, tgUserId: number, data: CallbackQuery }) => Promise<ISignInUserResult>
  sendMessage: (chatId: number | string, text: string, extra?: tt.ExtraReplyMessage) => Promise<ReturnType<Telegram['sendMessage']>>
  activateClub: (message: Message.TextMessage, code: string) => Promise<boolean>
}

export type ISignInUserResult = {loggedIn: false} | {loggedIn: true, club: Club, user: User}

export enum CallbackQueryCommands {
  signin = 'signin'
}

export type ITelegramHexApp = IHexCommonApp & {
  contexts: {
    club: (club: Club) => ClubContext,
  },
  Env: Env
}

export class TelegramBotUpdates {
  protected app: ITelegramHexApp;
  protected ports: ITelegramHexPorts;

  constructor(deps: {
    app: ITelegramHexApp,
    ports: ITelegramHexPorts,
  }) {
    this.app = deps.app;
    this.ports = deps.ports;
  }

  /**
   * Entrypoint, should be triggered on every Telegram message
   *
   * @param body
   * @param key
   */
  async onTelegramUpdate(body: Update, key: string): Promise<null | { error: string }> {
    const keyIsValid = this.ports.tgCheckKey(key);
    if (!keyIsValid) return {error: 'Key is not valid'};

    this.app.log.info('telegram:update', {data: body});

    if ('message' in body) {
      const message = body.message;
      await this.onMessage(message);
    } else if ('chat_join_request' in body) {
      const chatJoinRequest = body.chat_join_request;
      await this.onChatJoinRequest(chatJoinRequest);
    } else if ('my_chat_member' in body) {
      const myChatMember = body.my_chat_member;
      await this.onMyChatMember(myChatMember);
    } else if ('callback_query' in body) {
      const callbackQuery = body.callback_query;
      await this.onCallbackQuery(callbackQuery);
    }

    return null;
  }

  /**
   * Called from onTelegramUpdate
   *
   * @param chatJoinRequest
   */
  async onChatJoinRequest(chatJoinRequest: ChatJoinRequest) {
    if (await this.ports.isUserAllowed(chatJoinRequest.chat.id, chatJoinRequest.from.id)) {
      await this.ports.approveChatJoinRequest(chatJoinRequest.chat.id, chatJoinRequest.from.id);
    } else {
      await this.ports.declineChatJoinRequest(chatJoinRequest.chat.id, chatJoinRequest.from.id);
    }
  }

  /**
   * Called from onTelegramUpdate
   *
   * @param message
   */
  async onMessage(message: Message) {
    if ('text' in message) {
      if (message.chat.type === 'private') {
        const command = getCommandAndParam(message.text);

        if (command.command === '/start') {
          if (command.param) {
            if (this.ports.signInUser) {

              await this.ports.sendMessage(message.chat.id, "You're binding your wallet to Telegram account", {
                reply_markup: {
                  inline_keyboard: [
                    [{text: 'Confirm', callback_data: `${CallbackQueryCommands.signin}:${command.param}`}],
                  ],
                },
              });

            }
          }
        }
      } else { // group, supergroup or channel
        const command = getCommandAndParam(message.text);

        if (command.command === '/activate') {
          await this.ports.activateClub(message, command.param);
        }
      }
    }

    return null; // stub
  }

  async onCallbackQuery(query: CallbackQuery) {
    const data = (query.data || '').split(':', 2);
    if (data.length == 2) {
      const [command, value] = data;

      if (command === CallbackQueryCommands.signin) {
        const signInResult = await this.ports.signInUser({
          tgUserId: query.from.id,
          code: value,
          data: query,
        });

        if (signInResult.loggedIn) {
          const club = signInResult.club;

          const telegramInviteLink = await this.app.contexts.club(club).telegramInviteLink();

          const inline_keyboard = [];
          if (telegramInviteLink) {
            inline_keyboard.push([{text: `${club.name} in Telegram`, url: telegramInviteLink}])
          }
          if (club.slug) {
            inline_keyboard.push([{text: `${club.name} page on Clubeeo`, url: `https://clubeeo.com/${club.slug}`}])
          }

          await this.ports.sendMessage(query.message.chat.id, `Successfully signed in to ${club.name}`, {
            reply_markup: {
              inline_keyboard,
            },
          });
        } else {
          await this.ports.sendMessage(query.message.chat.id, 'Can\'t sign in. Please retry');
        }
      }
    }
  }

  /**
   * Called from onTelegramUpdate
   *
   * @param myChatMember
   */
  async onMyChatMember(myChatMember: ChatMemberUpdated) {
    await this.ports.tgChatStateUpdated({
      tgChatId: myChatMember.chat.id,
      status: myChatMember.new_chat_member.status,
    });
  }

  async onUserOwnershipChange(telegramUser: { userId: number }, telegramChat: { chatId: number }) {
    if (await this.ports.isUserAllowed(telegramChat.chatId, telegramUser.userId)) {
      await this.ports.approveChatJoinRequest(telegramChat.chatId, telegramUser.userId);
    } else {
      await this.ports.declineChatJoinRequest(telegramChat.chatId, telegramUser.userId);
    }
  }
}
