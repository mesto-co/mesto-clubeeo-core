import {BaseService} from './BaseService'
import User from '../models/User'
import UserExt from '../models/UserExt'
import {UserExtMessage} from '../models/UserExtMessage'
import {ExtService} from '../lib/enums'

export interface ISendToUserOpts {
  onSend?: (userExt: UserExt) => void
  batchId?: string
  senderId?: string
  clubId?: string
}

export class UserSenderService extends BaseService {
  async sendToUser(user: User, message: string, opts?: ISendToUserOpts) {
    for(const userExt of user.userExts) {
      await this.sendToUserExt(userExt, message, opts);
    }
  }

  async sendToUserExt(userExt: UserExt, message: string, opts?: ISendToUserOpts) {
    if (userExt.enabled === false) return;

    if (userExt.service === ExtService.tg) {
      try {
        const userMessage = this.app.m.create(UserExtMessage, {
          userExt: {id: userExt.id},
          user: {id: userExt.userId},
          message,
          batch: opts?.batchId ? {id: opts?.batchId} : undefined,
          sender: opts?.senderId ? {id: opts?.senderId} : undefined,
          club: opts?.clubId ? {id: opts?.clubId} : undefined,
        });
        await this.app.m.save(UserExtMessage, userMessage);

        await this.app.TelegramContainer.Telegram.sendMessage(
          userExt.extId,
          message,
          {
            parse_mode: 'HTML'
          }
        );

        userMessage.isSent = true;
        await this.app.m.save(UserExtMessage, userMessage);

        if (opts?.onSend) {
          opts.onSend(userExt);
        }
      } catch (e) {
        this.app.log.error(e.message, {data: e.toString()});
      }
    }
  }
}
