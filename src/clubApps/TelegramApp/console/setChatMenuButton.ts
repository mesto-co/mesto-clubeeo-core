import {BaseTelegramContainer} from '../TelegramContainer';
import {AppEnv} from '../../../appEnv';

const env = AppEnv.getInstance();
const c = new BaseTelegramContainer(env);

c.Telegram.setChatMenuButton({
  menuButton: {
    type: 'web_app',
    text: 'menu',
    web_app: {
      url: `${env.tgCallbackRoot}/telegram/webapp`,
    }
  }
}).then(result => {
  console.log(result)
}).catch(err => {
  console.log(err)
})
