import mitt, {Emitter} from 'mitt';
import App from '../../../App'
import {ExtService} from '../../../lib/enums'
import {IMessageAndCommand, TBotCommandEvents} from './botEventsInterfaces'
import UserExt from '../../../models/UserExt'
import {UserExtVal} from '../../../models/UserExtVal'
import {Message} from 'typegram/message'
import Member from '../../../models/Member'
import {cleanupTgMessage, tgI} from '../lib/tgHelpers'
import MemberBadge from '../../../models/MemberBadge'
import {BadgeType} from '../../../models/ClubBadge'
import {fetchUserAndExtByExtId} from '../../../contexts/UserExtContext'

export function botCommandEvents(app: App) {
  const events: Emitter<TBotCommandEvents> = mitt<TBotCommandEvents>();

  const Telegram = app.TelegramContainer.Telegram;

  events.on('command', async ({message, command}: IMessageAndCommand) => {
    if (message.from.is_bot) {
      return;
    }

    const {userExt, user} = await fetchUserAndExtByExtId(app, {
      service: ExtService.tg,
      extId: String(message.from.id),
      userData: message.from,
      sourceData: message,
    });
    await app.em.createOrUpdateBy(UserExtVal, {userExt: {id: userExt.id}, key: 'botState'}, {value: ''});

    const activeClubCtx = await app.contexts.user(user).inActiveClubContext();
    const member = await activeClubCtx.fetchMember();

    const reply = async (text) => {
      return await Telegram.sendMessage(message.chat.id,
        text, {
          parse_mode: 'HTML',
        });
    }

    if (command.command === '/start') {
      // todo: move start command processing here

      // const switchUserClub = async (data: { clubSlug: string }): Promise<Club> => {
      //   const club = await app.repos.club.findBySlug(data.clubSlug);

      //   if (club && user) {
      //     await app.em.createOrLazyUpdateBy(Member, {
      //       user: {id: user.id},
      //       club: {id: club.id},
      //     }, {
      //       enabled: true,
      //     });
      //     const userCtx = await app.contexts.user(user);
      //     await userCtx.setActiveClub(club);
      //   }

      //   return club;
      // }

      // if (command.param) {
      //   const club = await switchUserClub({
      //     clubSlug: command.param.split(' ')[0].toLowerCase(),
      //   });

      //   if (club) {
      //     await Telegram.sendMessage(message.chat.id, `${club.name} is active\n\nuse /help for bot info`, {
      //       reply_markup: {
      //         inline_keyboard: [
      //           [{
      //             text: `open ${club.name} menu`,
      //             web_app: {url: `${app.Env.tgCallbackRoot}/telegram/webapp/${club.slug}`},
      //           }],
      //         ],
      //       },
      //     });
      //   } else {
      //     await Telegram.sendMessage(message.chat.id, "You're binding your wallet to Telegram account", {
      //       reply_markup: {
      //         inline_keyboard: [
      //           [{text: 'Confirm', callback_data: `${CallbackQueryCommands.signin}:${command.param}`}],
      //         ],
      //       },
      //     });
      //   }
      // } else if (!command.param) {
        await Telegram.sendMessage(message.chat.id, [
          "Добро пожаловыть в Место!",
        ].join("\n"), {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{
                text: `Open App`,
                web_app: {url: `${app.Env.tgCallbackRoot}/telegram/webapp/${app.Env.defaultClub}`},
              }],
            ],
          },
        });
      // }
    } else if (command.command === '/create') {

      const club = await app.repos.club.findBySlug(app.Env.defaultClub);
      const createLink = `${app.Env.tgCallbackRoot}/me/club/new?telegramLoginCode=${await app.repos.extCode.fetchTgLoginCode(user, club)}`;

      await Telegram.sendMessage(message.chat.id, [
        "Please, navigate to the dashboard to create a new club",
      ].join("\n"), {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{
              text: `open club creation form`,
              url: createLink,
            }],
          ],
        },
      });
    } else if (command.command === '/login') {

      // find club by slug if provided
      const club = await app.repos.club.findBySlug(command.param.toLowerCase() || app.Env.defaultClub)
        || await app.repos.club.findBySlug(app.Env.defaultClub);

      const loginLink = `${app.Env.tgCallbackRoot}/${club.slug}/home?telegramLoginCode=${await app.repos.extCode.fetchTgLoginCode(user, club)}`;

      await Telegram.sendMessage(message.chat.id, [
        `use this <a href='${loginLink}' target='_blank'>link</a> or button to login`,
      ].join("\n"), {
        parse_mode: 'HTML',
        // disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [{
              text: `login to ${club.name}`,
              url: loginLink,
            }],
          ],
        },
      });

    } else if (command.command === '/set_bio') {

      await app.em.createOrUpdateBy(UserExtVal, {userExt: {id: userExt.id}, key: 'botState'}, {value: 'set_bio'});

      await reply('ok, send me the new bio for your community profile');

    } else if (command.command === '/member') {
      const tgUserContextByMessage = await app.TelegramContainer.tgUserContextByMessage(message);
      const memberCtx = tgUserContextByMessage.memberCtx;

      const parsedUsername = command.param.split('@');
      if (parsedUsername.length === 2 && parsedUsername[0] === '') {
        const [_, username] = parsedUsername;

        const requestedUserExt = await app.m.findOneBy(UserExt, {
          service: ExtService.tg,
          username,
        });
        if (requestedUserExt) {
          const member = await app.m.findOneBy(Member, {
            user: {id: requestedUserExt.userId},
            club: {id: memberCtx.club.id},
          });

          if (member) {
            const roles = await memberCtx.roles();
            const badges = await memberCtx.getBadges();

            const formatClubBadge = (badge: MemberBadge) => {
              const result = [cleanupTgMessage(badge.clubBadge.title)];
              if (badge.clubBadge.badgeType === BadgeType.score) {
                result.push(`(${badge.value})`);
              }
              return result.join(' ');
            }

            await Telegram.sendMessage(message.chat.id,
              [
                `<strong>member profile ${tgI(command.param)} in ${tgI(memberCtx.club.name)}</strong>`,
                '',
                '<strong>bio</strong>',
                member.state['bio'] ? cleanupTgMessage(member.state['bio']) : tgI('empty'),
                '',
                '<strong>roles</strong>',
                roles.length > 0 ? cleanupTgMessage(roles.map(role => role?.name).join(', ')) : tgI('no roles'),
                '',
                '<strong>badges and scores</strong>',
                badges.length > 0 ? badges.map(badge => formatClubBadge(badge)).join(', ') : tgI('no badges'),
              ].join("\n"), {
                parse_mode: 'HTML',
                // reply_markup: {
                //   inline_keyboard: [
                //     [{
                //       text: `open profile`,
                //       web_app: {url: `${app.Env.tgCallbackRoot}/telegram/webapp/${memberCtx.club.slug}?page=memberProfile&memberId=${member.id}`},
                //     }],
                //   ],
                // },
              });
            return;
          }
        }
      }

      await reply(`member ${tgI(command.param)} is not found in ${tgI(memberCtx.club.name)}`);

    } else if (command.command === '/badge') {
      const tgUserCtx = await app.TelegramContainer.tgUserContextByMessage(message);
      const memberCtx = tgUserCtx.memberCtx;

      const parsedBadgeName = command.param.split(' ');
      if (parsedBadgeName.length !== 2) return reply(
        `can't assign badge to user: wrong command parameters format`);

      const [badgeSlug, taggedUserName] = parsedBadgeName;

      const parsedUsername = taggedUserName.split('@');
      if (parsedUsername.length !== 2 || parsedUsername[0] !== '') return await reply(
        `can't assign badge to user: wrong command parameters format`);

      const [_, username] = parsedUsername;

      const requestedUserExt = await app.m.findOne(UserExt, {
        where: {
          service: ExtService.tg,
          username,
        },
        relations: {
          user: true,
        },
      });
      if (!requestedUserExt?.user) return await reply(
        `can't assign badge to user: user not found`);

      const isAdmin = await memberCtx.hasRole('admin');
      if (!isAdmin) return await reply(
        `you don't have right to grant this badge`);

      const {memberBadge, clubBadge, isCreated, isChanged} = await app.engines.badgeEngine.grantBadgeBySlug(
        requestedUserExt.user,
        memberCtx.club,
        badgeSlug,
      );

      if (isChanged) {
        await reply(
          `badge ${tgI(clubBadge.title)} was granted to @${tgI(requestedUserExt.username)} in ${tgI(memberCtx.club.name)}`,
        );
      } else {
        await reply(
          `badge ${tgI(clubBadge.title)} wasn't granted: it was already granted to @${tgI(requestedUserExt.username)} in ${tgI(memberCtx.club.name)}`,
        );
      }
    } else if (command.command === '/help') {

      await reply([
          "<strong>bot commands:</strong>\n",
          "/start <i>club_name</i> - switch to club by url name",
          "/login <i>club_name</i> - login with Telegram to web app (club name is optional)",
          "/help - get this message",
          "",
          "<strong>member</strong>",
          "/set_bio - change your bio in the active community",
          "/member <i>username</i> - get member profile",
          "",
          "<strong>club admin</strong>",
          "/create - start creating a new club",
          "/badge <i>badge_name</i> <i>username</i> - grant badge to member",
        ].join("\n"),
      );

    }
  });

  events.on('text', async ({message}: { message: Message.TextMessage }) => {
    const Telegram = app.TelegramContainer.Telegram;

    const userExt = await app.m.findOneBy(UserExt, {
      service: ExtService.tg,
      extId: String(message.from.id),
    });
    const userExtVal = await app.m.findOneBy(UserExtVal, {userExt: {id: userExt.id}, key: 'botState'});

    if (userExtVal?.value === 'set_bio') {
      const user = await app.repos.user.findUserByExtId(ExtService.tg, userExt.extId);
      const memberCtx = await app.contexts.user(user).inActiveClubContext();
      const {value: member} = await memberCtx.fetchMember();

      member.state = {...member.state, bio: message.text}
      await app.m.save(member);

      await Telegram.sendMessage(message.chat.id,
        `Your bio in ${memberCtx.club.name} is updated.`, {
          parse_mode: 'HTML',
        });

      userExtVal.value = '';
      await app.m.save(userExtVal);
    }
  });

  return events;
}
