import App from '../../../App'
import UserInClubContext from '../../../contexts/UserInClubContext'
import UserExt from '../../../models/UserExt'
import {ExtService} from '../../../lib/enums'
import {Message} from 'typegram/message'
import {fetchUserAndExtByExtId} from '../../../contexts/UserExtContext'

export async function tgUserContextByMessage(app: App, message: Message) {
  const {userExt, user} = await fetchUserAndExtByExtId(app, {
    service: ExtService.tg,
    extId: String(message.from.id),
    userData: message.from,
    sourceData: message,
  });

  const memberCtx = await app.contexts
    .user(user)
    .inActiveClubContext();

  return new TgUserContext(app, userExt, memberCtx);
}

export class TgUserContext {
  readonly app: App;
  readonly memberCtx: UserInClubContext;

  constructor(app: App, userExt: UserExt, memberCtx: UserInClubContext) {
    this.app = app;
    this.memberCtx = memberCtx;
  }
}
