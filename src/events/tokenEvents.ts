import mitt, {Emitter} from 'mitt';
import App from '../App'
import ClubRoleToken from '../models/ClubRoleToken'
import ClubExt from '../models/ClubExt'
import {WalletNft} from '../models/WalletNft'
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
    } catch (e) {
      app.log.error('tokenEvents:tokenIsSold:telegramHandle:error', {
        data: {
          message: e.message,
          data,
        },
      });
    }
  });

  return tokenEvents;

}
