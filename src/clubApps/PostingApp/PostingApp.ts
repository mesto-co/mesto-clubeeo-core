import App from '../../App'
import Post from '../../models/Post'
import ClubExt from '../../models/ClubExt'
import {ExtService} from '../../lib/enums'
import Posted from '../../models/Posted'
import ClubApp from '../../engines/AppsEngine/models/ClubApp'

export default class PostingApp {
  protected app: App
  protected clubApp: ClubApp

  constructor(app: App, clubApp: ClubApp) {
    this.app = app;
    this.clubApp = clubApp;
  }

  async post(post: Post) {
    const clubExtId = this.clubApp.config['clubExtId'];
    const clubId = this.clubApp.clubId;

    const clubExt = await this.app.m.findOneBy(ClubExt, {
      id: clubExtId,
      club: {id: clubId},
      service: ExtService.tg,
    });

    if (!clubExt) {
      this.app.log.error('ClubExt is not found', {
        data: {
          id: clubExtId,
          club: {id: clubId},
          service: ExtService.tg,
        },
      })
      return
    }

    // post for TG
    // todo: factory

    // check if already posted
    const postedRels = {
      club: {id: clubId},
      clubApp: {id: this.clubApp.id},
      post: {id: post.id},
      clubExt: {id: clubExt.id},
    }
    const posted = await this.app.m.countBy(Posted, postedRels);

    if (!posted) {
      // save posted
      await this.app.m.save(this.app.m.create(Posted, {...postedRels, text: post.text}));

      await this.app.TelegramContainer.Telegram.sendMessage(
        clubExt.extId,
        post.text,
        {
          parse_mode: 'HTML'
        }
      )
    }
  }
}
