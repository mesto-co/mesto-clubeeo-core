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
  // tokenIsSold: {
  //   // tokenContract: string,
  //   walletNft: WalletNft,
  // }
};

export function clubUserEventsFactory(app: App): Emitter<ClubUserEvents> {

  const clubUserEvents: Emitter<ClubUserEvents> = mitt<ClubUserEvents>();

  clubUserEvents.on('rolesAdded', async (data) => {

  })

  clubUserEvents.on('rolesRemoved', async (data) => {

  })

  // // handle telegram: ban user if token is sold
  clubUserEvents.on('userBanned', async (data) => {
    try {
  //     const tgUserExt = await app.repos.userExt.findOneByWalletNft(data.walletNft, UserExtService.tg);
  //     const tgUserId = tgUserExt.extId;
  //
  //     const clubs = await app.m.find(ClubRoleToken, {
  //       tokenContract: data.walletNft.tokenContract,
  //     });
  //
  //     for (const club of clubs) {
  //       const tgClubExt = await app.m.findOne(ClubExt, {
  //         service: 'tg',
  //         club
  //       });
  //       const tgChatId = tgClubExt.extId;
  //
  //       await app.Telegram.banChatMember(tgChatId, Number(tgUserId));
  //     }
    } catch (e) {
      app.log.error('clubUserEvents:userBanned:telegramHandle:error', {
        data: {
          message: e.message,
          data,
        }
      });
    }
  });

  return clubUserEvents;

}


// userClubRoleChanged
// clubRoleTokenChanged
