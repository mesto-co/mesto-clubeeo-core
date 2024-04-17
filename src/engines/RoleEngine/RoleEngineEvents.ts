import mitt from 'mitt';
import App from '../../App'
import User from '../../models/User'
import Club from '../../models/Club'
import {IEntityId} from '../../lib/common'
import {eventNames} from '../MotionEngine/shared/eventNames'
import Member from '../../models/Member'
import ClubRole from '../../models/ClubRole'
import MemberRole from '../../models/MemberRole'

export type RoleEngineEvents = {
  roleGranted: {
    user: User | IEntityId,
    club: Club | IEntityId,
    member: Member | IEntityId,
    clubRole: ClubRole | IEntityId,
    memberRole: MemberRole,
    isCreated: boolean,
  },
  roleRemoved: {
    user: User | IEntityId,
    club: Club | IEntityId,
    member: Member | IEntityId,
    clubRole: ClubRole | IEntityId,
    memberRole: MemberRole,
  },
};

export const roleEngineEventsFactory = (app: App) => {
  const badgeEngineEvents = mitt<RoleEngineEvents>();

  badgeEngineEvents.on('roleGranted', async (data) => {
    const club = await app.repos.club.getOrLoad(data.club);
    const user = await app.repos.user.getOrLoad(data.user);
    const member = await app.repos.member.getOrLoad(data.member);

    await app.engines.motionEngine.processEvent(eventNames.role.granted, {
      club,
      user,
      member,
    }, {
      member,
      role: data.clubRole,
      memberRole: data.memberRole,
      isCreated: data.isCreated,
    });
  });

  badgeEngineEvents.on('roleRemoved', async (data) => {
    const club = await app.repos.club.getOrLoad(data.club);
    const user = await app.repos.user.getOrLoad(data.user);
    const member = await app.repos.member.getOrLoad(data.member);

    await app.engines.motionEngine.processEvent(eventNames.role.removed, {
      club,
      user,
      member,
    }, {
      member,
      role: data.clubRole,
      memberRole: data.memberRole,
    });
  });

  return badgeEngineEvents;
}
