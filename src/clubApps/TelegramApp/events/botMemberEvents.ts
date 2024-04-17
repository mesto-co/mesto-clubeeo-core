import mitt, {Emitter} from 'mitt';
import App from '../../../App'
import {Chat, ChatMemberUpdated} from 'typegram/manage'
import {ExtService} from '../../../lib/enums'
import {TBotMemberEvents} from './botEventsInterfaces'

const userNotFoundTemplate = 'Registered user is not found';

const notEnoughRightsTemplate = (clubName: string) => `You added the bot, but you don't have access rights to manage "${clubName}".\n\n`
  + `Please, remove the bot and switch to another club using <pre>/start CLUB_SLUG</pre> command\n`
  + `or ask "${clubName}" admin to add the bot`;

const botAddedTemplate = (clubName: string, chat: Chat) => `Chat "${chat['title']}" is successfully added to "${clubName}".`;

const botAlreadyAddedTemplate = (clubName: string, chat: Chat) => `Chat "${chat['title']}" is is already added to "${clubName}".`;

export function botMemberEvents(app: App) {
  const events: Emitter<TBotMemberEvents> = mitt<TBotMemberEvents>();

  const Telegram = app.TelegramContainer.Telegram;

  events.on('botPromotedToAdmin', async (data: { myChatMember: ChatMemberUpdated }) => {
    const fromId = data.myChatMember.from.id;

    const user = await app.repos.user.findUserByExtId(ExtService.tg, String(data.myChatMember.from.id));
    if (!user) {
      await Telegram.sendMessage(fromId, userNotFoundTemplate);

      return;
    }

    const memberCtx = await app.contexts.user(user).inActiveClubContext();
    const club = memberCtx.club;
    const clubName = club.name || club.slug;
    if (!await memberCtx.hasRole('admin')) {
      await Telegram.sendMessage(fromId, notEnoughRightsTemplate(clubName), {
        parse_mode: 'HTML',
      });

      return;
    }

    const clubExt = await app.repos.clubExt.findOrCreate({
      extId: String(data.myChatMember.chat.id),
      service: ExtService.tg,
      club: memberCtx.club,
    }, {
      debugData: {myChatMember: data.myChatMember},
    });

    if (clubExt.isCreated) {
      await Telegram.sendMessage(fromId, botAddedTemplate(clubName, data.myChatMember.chat), {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{
              text: `open ${clubName} menu`,
              web_app: {url: `${app.Env.tgCallbackRoot}/telegram/webapp/${club.slug}`},
            }],
          ],
        },
      });
    } else {
      await Telegram.sendMessage(fromId, botAlreadyAddedTemplate(clubName, data.myChatMember.chat), {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{
              text: `open ${clubName} menu`,
              web_app: {url: `${app.Env.tgCallbackRoot}/telegram/webapp/${club.slug}`},
            }],
          ],
        },
      });
    }
  });

  return events;
}
