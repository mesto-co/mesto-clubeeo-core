import {BaseTelegramContainer} from '../TelegramContainer';
import {Env} from '../../../env';

const c = new BaseTelegramContainer(Env.getInstance())

c.Telegram.setChatMenuButton({
  menuButton: {
    type: 'web_app',
    text: 'Game',
    web_app: {
      url: Env.getInstance().siteUrl + '/telegram/webapp',
    }
  }
}).then(result => {
  console.log(result)
}).catch(err => {
  console.log(err)
})
