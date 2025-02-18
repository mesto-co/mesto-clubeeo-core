import {TelegramEventCodes} from '../../../clubApps/TelegramApp/lib/telegramConsts'
import { profileEventNames } from '../../../clubApps/MestoProfileApp/MestoProfileAppConfig'

export const eventNames = {
  badge: {
    granted: 'badge:granted',
  },
  role: {
    granted: 'role:granted',
    removed: 'role:removed',
  },
  ...profileEventNames,

  post: {
    reaction: 'post:reaction',
  },
  task: {
    completed: 'task:completed',
  },
  telegram: {
    botActivated: TelegramEventCodes['telegram:botActivated'],
    signIn: TelegramEventCodes['telegram:signIn'],
  },
  typeform: {
    completed: 'typeform:completed'
  }
}

export const actionTypes = {
  badge: {
    grant: 'badge:grant',
  },
  role: {
    grant: 'role:grant',
    remove: 'role:remove',
  },

  tg: {
    send_message: 'tg:send_message',
  },
  webhook: {
    post: 'webhook:post',
  }
}
