import {Message} from 'typegram/message'
import {ICommandAndParam} from '../lib/TgParse'
import {ChatMemberUpdated} from 'typegram/manage'

export type IMessageAndCommand = {
  message: Message.TextMessage,
  command: ICommandAndParam,
}

export type TBotCommandEvents = {
  command: IMessageAndCommand,
  text: {message: Message.TextMessage},
}

export type TBotMemberEvents = {
  botPromotedToAdmin: {
    myChatMember: ChatMemberUpdated,
  }
}
