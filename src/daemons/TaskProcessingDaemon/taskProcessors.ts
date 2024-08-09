import App from '../../App'
import Task, {TaskState} from '../../models/Task'
import UserExt from '../../models/UserExt'
import {ExtService} from '../../lib/enums'
import * as tt from 'telegraf/src/telegram-types'
import {ITaskResult} from './TaskProcessDaemonLogic'
import ClubBadge from '../../models/ClubBadge'
import {actionTypes} from '../../engines/MotionEngine/shared/eventNames'

export const taskProcessors = (app: App) => {
  return {
    [actionTypes.tg.send_message]: async (task: Task): Promise<ITaskResult> => {
      const message = task.data.message;
      if (!message) return { state: TaskState.failed, error: 'no message to send' };

      let chatId = task.data.chatId;

      if (!chatId) {
        if (task.userId) {
          const userExt = await app.m.findOneBy(UserExt, {
            user: {id: task.userId},
            service: ExtService.tg,
          });
          if (!userExt) return { state: TaskState.failed, error: 'user telegram account is not found' };

          chatId = userExt.extId;
        }
      }

      const extra: tt.ExtraReplyMessage = {}
      if (task.data.parse_mode) extra.parse_mode = task.data.parse_mode;
      if (task.data.entities) extra.entities = task.data.entities;
      if (task.data.reply_markup) extra.reply_markup = task.data.reply_markup;
      if (task.data.disable_web_page_preview) extra.disable_web_page_preview = task.data.disable_web_page_preview;
      if (task.data.disable_notification) extra.disable_notification = task.data.disable_notification;
      if (task.data.protect_content) extra.protect_content = task.data.protect_content;
      if (task.data.reply_to_message_id) extra.reply_to_message_id = task.data.reply_to_message_id;
      if (task.data.allow_sending_without_reply) extra.allow_sending_without_reply = task.data.allow_sending_without_reply;

      const result = await app.TelegramContainer.Telegram.sendMessage(
        chatId,
        message,
        extra,
      );

      return {
        state: TaskState.done,
        data: result,
      };
    },

    [actionTypes.badge.grant]: async (task: Task): Promise<ITaskResult> => {
      const badgeId = task.data.badgeId;
      if (!badgeId) return { state: TaskState.failed, error: 'no badgeId' };

      const clubBadge = await app.m.findOneBy(ClubBadge, {
        id: badgeId,
        club: {id: task.clubId}
      });
      if (!badgeId) return { state: TaskState.failed, error: 'badge not found' };

      const {memberBadge, isCreated} = await app.engines.badgeEngine.grantBadgeToUser({id: task.userId}, clubBadge);

      return {
        state: TaskState.done,
        data: { memberBadge, isCreated }
      };
    },

    [actionTypes.webhook.post]: async (task: Task): Promise<ITaskResult> => {
      try {
        const response = await app.axios.post(
          task.data['url'],
          task.data['payload'] || {}
        );

        return {
          state: TaskState.done,
          data: {
            response: response.data
          }
        }
      } catch (e) {
        return {
          state: TaskState.failed,
          error: e.message,
          data: {
            httpStatus: e.response?.status,
            response: e.response?.data
          }
        }
      }

    }

  }
}
