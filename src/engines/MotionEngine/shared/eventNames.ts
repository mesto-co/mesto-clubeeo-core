import {TelegramEventCodes} from '../../../clubApps/TelegramApp/lib/telegramConsts'
import {DiscordEventCodes} from '../../../clubApps/DiscordApp/lib/discordConsts'
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


  discord: {
    botActivated: DiscordEventCodes['discord:botActivated'],
    signIn: DiscordEventCodes['discord:signIn'],
  },
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


  discord: {
    SyncMemberRoles: 'discord:SyncMemberRoles',
  },
  tg: {
    send_message: 'tg:send_message',
  },
  webhook: {
    post: 'webhook:post',
  }
}
