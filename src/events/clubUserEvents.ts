import mitt, {Emitter} from 'mitt';
import App from '../App'
import ClubRole from '../models/ClubRole'
import User from '../models/User'
import Club from '../models/Club'

export type ClubUserEvents = {
  userBanned: {

  },
  rolesAdded: {
    user: User,
    club: Club,
    roles: ClubRole[],
  },
  rolesRemoved: {
    user: User,
    club: Club,
    roles: ClubRole[],
  }
};

export function clubUserEventsFactory(): Emitter<ClubUserEvents> {

  const clubUserEvents: Emitter<ClubUserEvents> = mitt<ClubUserEvents>();

  clubUserEvents.on('rolesAdded', async (data) => {

  })

  clubUserEvents.on('rolesRemoved', async (data) => {

  })

  return clubUserEvents;

}
