import mitt, {Emitter} from 'mitt';
import App from '../App'
import ClubRoleToken from '../models/ClubRoleToken'
import ClubExt from '../models/ClubExt'
import {WalletNft} from '../models/WalletNft'
import DiscordApp from '../clubApps/DiscordApp/DiscordApp'
import {ExtService} from '../lib/enums'

export type TokenEvents = {
  tokenAmountChanged: {},
  tokenIsAcquired: {
    walletNft: WalletNft,
  },
  tokenIsSold: {
    // tokenContract: string,
    walletNft: WalletNft,
    previousAmount: number,
  },
  tokenAmountIncreased: {
    walletNft: WalletNft,
    previousAmount: number,
  },
  tokenAmountDecreased: {
    walletNft: WalletNft,
    previousAmount: number,
  }
};

export function tokenEventsFactory(app: App): Emitter<TokenEvents> {

  const tokenEvents: Emitter<TokenEvents> = mitt<TokenEvents>();

  tokenEvents.on('tokenIsSold', (data) => {
    app.log.info('events:tokenIsSold', {data});
  });

  // handle telegram: ban user if token is sold
  tokenEvents.on('tokenIsSold', async (data) => {
    try {
      const tgUserExt = await app.repos.userExt.findOneByWalletNft(data.walletNft, ExtService.tg);
      const tgUserId = tgUserExt.extId;

      const clubRoleTokens = await app.m.find(ClubRoleToken, {
        where: {
          tokenContract: {id: data.walletNft.tokenContract.id},
        },
        relations: {
          clubRole: true
        }
      });

      for (const clubRoleToken of clubRoleTokens) {
        const clubExt = await app.m.findOneBy(ClubExt, {
          service: ExtService.discord,
          club: {id: clubRoleToken.clubRole.clubId},
        });
        const tgChatId = clubExt.extId;

        await app.TelegramContainer.Telegram.banChatMember(tgChatId, Number(tgUserId));


        // const clubExt = await app.m.findOneBy(ClubExt, {
        //   service: ClubExtService.discord,
        //   club: {id: club.id},
        // });
        // const clubExtId = tgClubExt.extId;

        // await
      }
    } catch (e) {
      app.log.error('tokenEvents:tokenIsSold:telegramHandle:error', {
        data: {
          message: e.message,
          data,
        },
      });
    }
  });

  // handle telegram: ban user if token is sold
  tokenEvents.on('tokenIsSold', async (data) => {
    try {
      const userExt = await app.repos.userExt.findOneByWalletNft(data.walletNft, ExtService.discord);
      const userId = userExt.extId;

      const clubRoleTokens = await app.m.find(ClubRoleToken, {
        where: {
          tokenContract: {id: data.walletNft.tokenContract.id},
        },
        relations: {
          clubRole: true
        }
      });

      for (const clubRoleToken of clubRoleTokens) {
        const clubExt = await app.m.findOneBy(ClubExt, {
          service: ExtService.discord,
          club: {id: clubRoleToken.clubRole.clubId},
        });

        const discordApp = new DiscordApp({app});
        await discordApp.disableUser({
          userExt,
          clubExt,
        });
      }
    } catch (e) {
      app.log.error('tokenEvents:tokenIsSold:discordHandle:error', {
        data: {
          message: e.message,
          data,
        },
      });
    }
  });

  tokenEvents.on('tokenIsAcquired', async (data) => {
    try {
      const userExt = await app.repos.userExt.findOneByWalletNft(data.walletNft, ExtService.discord);
      const userId = userExt.extId;

      const clubRoleTokens = await app.m.find(ClubRoleToken, {
        where: {
          tokenContract: {id: data.walletNft.tokenContract.id},
        },
        relations: {
          clubRole: true
        }
      });

      for (const clubRoleToken of clubRoleTokens) {
        const clubExt = await app.m.findOneBy(ClubExt, {
          service: ExtService.discord,
          club: {id: clubRoleToken.clubRole.clubId},
        });

        const discordApp = new DiscordApp({app});
        await discordApp.enableUser({
          userExt,
          clubExt,
        });

      }
    } catch (e) {
      app.log.error('tokenEvents:tokenIsAcquired:discordHandle:error', {
        data: {
          message: e.message,
          data,
        },
      });
    }
  });

  return tokenEvents;

}
