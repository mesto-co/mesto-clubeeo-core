import Club from '../../models/Club'
import { MestoApp } from '../../App'
import {IClubApp} from '../../engines/AppsEngine/IClubApp'
import User from '../../models/User'
import ClubApp from '../../engines/AppsEngine/models/ClubApp'

type TPageAppConfig = Record<string, any>;

export default class PageApp implements IClubApp {
  readonly app: MestoApp;
  readonly club: Club;
  readonly clubApp: ClubApp;
  readonly config: TPageAppConfig;

  static appName = 'page';
  readonly appName: 'page';

  constructor(opts: {app: MestoApp, club: Club, config: TPageAppConfig, clubApp: ClubApp}) {
    this.app = opts.app;
    this.club = opts.club;
    this.config = opts.config;
    this.clubApp = opts.clubApp;
  }

  async getDataFor(opts: {user: User}): Promise<any> {
    return this.config;
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


  // async enableUser(opts: {
  //   // user: User,
  //   userExt: UserExt,
  //   // club: Club,
  //   clubExt: ClubExt,
  //   //role?
  // }) {
  //   // // assert(opts.user, 'user expected');
  //   // // assert(opts.club, 'club expected');
  //   // assert(opts.userExt.service === UserExtService.tg, `userExt.service === ${UserExtService.tg} is expected, but ${opts.userExt.service} given`);
  //   // assert(opts.clubExt.service === ClubExtService.tg, `clubExt.service === ${ClubExtService.tg} is expected, but ${opts.clubExt.service} given`);
  //   //
  //   // // shortcut
  //   // const app = this.deps.app;
  //   //
  //   // const tgChatId = Number(opts.clubExt.extId);
  //   // const tgUserId = Number(opts.userExt.extId);
  //   //
  //   // let tgUserState = await app.m.findOneBy(TgUserState, {
  //   //   tgChatId,
  //   //   tgUserId,
  //   // });
  //   //
  //   // if (!tgUserState) {
  //   //   tgUserState = app.m.create(TgUserState, {
  //   //     tgChatId, tgUserId,
  //   //     isBanned: false,
  //   //   });
  //   // } else if (tgUserState?.isBanned) {
  //   //   // unban user if user is already banned to allow enter the chat
  //   //   const result = await app.Telegram.unbanChatMember(tgChatId, tgUserId);
  //   //
  //   //   app.log.info('unbanChatMember', {
  //   //     data: {tgChatId, tgUserId, result}
  //   //   });
  //   //
  //   //   tgUserState.isBanned = false;
  //   // }
  //   //
  //   // await app.m.save(tgUserState);
  //   //
  //   // const result = await app.Telegram.approveChatJoinRequest(tgChatId, tgUserId);
  //   //
  //   // app.log.info('approveChatJoinRequest', {
  //   //   data: {tgChatId, tgUserId, result}
  //   // });
  // }
  //
  // disableUser(opts: {
  //   // user: User,
  //   userExt: UserExt,
  //   // club: Club,
  //   clubExt: ClubExt,
  //   //role?
  // }) {
  //
  // }
}
