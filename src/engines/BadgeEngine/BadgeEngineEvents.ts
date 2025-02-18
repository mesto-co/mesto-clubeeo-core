import mitt from 'mitt';
import { MestoApp as App } from '../../App'
import User from '../../models/User'
import Club from '../../models/Club'
import ClubBadge from '../../models/ClubBadge'
import MemberBadge from '../../models/MemberBadge'
import {IEntityId} from '../../lib/common'
import {eventNames} from '../MotionEngine/shared/eventNames'
import {tgI} from '../../clubApps/TelegramApp/lib/tgHelpers'
import {Telegram} from 'telegraf'
import UserExt from '../../models/UserExt'
import {ExtServicesEnum} from '../../lib/enums'
import Member from '../../models/Member'

export type BadgeEngineEvents = {
  badgeGranted: {
    user: User | IEntityId,
    club: Club | IEntityId,
    member: Member | IEntityId,
    clubBadge: ClubBadge,
    memberBadge: MemberBadge,
    isCreated: boolean,
  }
};

export const badgeEngineEventsFactory = (app: App) => {
  const badgeEngineEvents = mitt<BadgeEngineEvents>();

  badgeEngineEvents.on('badgeGranted', async (data) => {
    const club = await app.repos.club.getOrLoad(data.club);
    const user = await app.repos.user.getOrLoad(data.user);
    const member = await app.repos.member.getOrLoad(data.member);

    await app.engines.motionEngine.processEvent(eventNames.badge.granted, {
      club,
      user,
      member,
    }, {
      member,
      badge: data.clubBadge,
      memberBadge: data.memberBadge,
      isCreated: data.isCreated,
    });

    //todo: remove
    //todo: create "informer engine", to send notifications to user and move there
    const tgExt = await app.m.findOneBy(UserExt, {
      service: ExtServicesEnum.tg,
      user: {id: user.id},
      enabled: true,
    });

    if (tgExt) {
      try {
        await app.TelegramContainer.Telegram.sendMessage(tgExt.extId,
          `you've got a ${tgI(data.clubBadge.title)} badge in ${tgI(club.name)}!`, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{
                  text: `open profile`,
                  web_app: {url: `${app.Env.tgCallbackRoot}/telegram/webapp/${club.slug}`},
                }],
              ],
            },
          });
      } catch (e) {
        app.log.error(e.message, {data: {error: e.toString()}});
      }
    }
  });

  return badgeEngineEvents;
}
