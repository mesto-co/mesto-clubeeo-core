// export class DiscordContainer {
// }

import UserExt from '../../models/UserExt'
import ClubExt from '../../models/ClubExt'
import App from '../../App'

export interface ITelegramDeps {
  app: App //for quick access; to be removed in favor of explicit deps
}

export interface IUserExternalLink {

}

export default class TelegramApp {
  readonly deps: ITelegramDeps;

  constructor(deps: ITelegramDeps) {
    this.deps = deps;
  }

  // static
  getAppConfig() {}

  // admin
  getConfig() {}

  setConfig() {}

  getDefaultConfig() {}

  // user

  isAvailableForUser() {

  }

  // async userExternalLinks(): Array<IUserExternalLink> {
  //
  // }

  //?
  getUserConfig() {}
  getUserState() {}
  setUserState() {}


  async enableUser(opts: {
    // user: User,
    userExt: UserExt,
    // club: Club,
    clubExt: ClubExt,
    //role?
  }) {
    // // assert(opts.user, 'user expected');
    // // assert(opts.club, 'club expected');
    // assert(opts.userExt.service === UserExtService.tg, `userExt.service === ${UserExtService.tg} is expected, but ${opts.userExt.service} given`);
    // assert(opts.clubExt.service === ClubExtService.tg, `clubExt.service === ${ClubExtService.tg} is expected, but ${opts.clubExt.service} given`);
    //
    // // shortcut
    // const app = this.deps.app;
    //
    // const tgChatId = Number(opts.clubExt.extId);
    // const tgUserId = Number(opts.userExt.extId);
    //
    // let tgUserState = await app.m.findOneBy(TgUserState, {
    //   tgChatId,
    //   tgUserId,
    // });
    //
    // if (!tgUserState) {
    //   tgUserState = app.m.create(TgUserState, {
    //     tgChatId, tgUserId,
    //     isBanned: false,
    //   });
    // } else if (tgUserState?.isBanned) {
    //   // unban user if user is already banned to allow enter the chat
    //   const result = await app.Telegram.unbanChatMember(tgChatId, tgUserId);
    //
    //   app.log.info('unbanChatMember', {
    //     data: {tgChatId, tgUserId, result}
    //   });
    //
    //   tgUserState.isBanned = false;
    // }
    //
    // await app.m.save(tgUserState);
    //
    // const result = await app.Telegram.approveChatJoinRequest(tgChatId, tgUserId);
    //
    // app.log.info('approveChatJoinRequest', {
    //   data: {tgChatId, tgUserId, result}
    // });
  }

  disableUser(opts: {
    // user: User,
    userExt: UserExt,
    // club: Club,
    clubExt: ClubExt,
    //role?
  }) {

  }
}
