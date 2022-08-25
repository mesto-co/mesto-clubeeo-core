import App from './App';
import {WalletNft} from './models/WalletNft';
import {MoreThan} from 'typeorm';
import {timeout} from './api/auth/authRoutes';

export default function (app: App) {
  let lock = false;
  /*
  setInterval(async () => {
    if (!lock) {
      try {
        lock = true;

        app.log.info('cron:walletSync:started')

        do {
          let currentId = 0;

          const walletNft = await app.m.findOne(WalletNft, {
            where: {
              id: MoreThan(currentId),
            },
            relations: ['wallet', 'wallet.user', 'tokenContract']
          });

          if (!walletNft) {
            break;
          }

          currentId = walletNft.id;

          await app.WalletService.syncWalletTokenAmount(walletNft.wallet, walletNft.tokenContract);

          // if (newAmount > 0) {
          //   if (walletNft.ownedAmount === 0) {
          //     app.tokenEvents.emit('tokenIsAcquired', {
          //       walletNft,
          //       newAmount,
          //     });
          //   } else if (newAmount > walletNft.ownedAmount) {
          //     // not used yet
          //     // app.tokenEvents.emit('tokenAmountIncreased', {
          //     //   walletNft,
          //     // });
          //   } else if (walletNft.ownedAmount < newAmount) {
          //     // not used yet
          //     // app.tokenEvents.emit('tokenAmountDecreased', {
          //     //   walletNft,
          //     // });
          //   }
          //   // else: amount not changed
          // } else {
          //   // no more tokens on wallet
          //
          //   if (walletNft.ownedAmount > 0) {
          //     // sold
          //     app.tokenEvents.emit('tokenIsSold', {
          //       walletNft,
          //     });
          //   }
          //   // else: amount not changed (was zero already)
          // }

          // if (!ownsToken && walletNft.ownedAmount > 0) {
          //
          // } else if (walletNft.ownedAmount === 0) {
          //   // newly bought
          // } else {
          //   // acquired more
          // } else {
          //   // partially sold
          // }

          await timeout(5000);

          //todo: unban
        } while (true);

        app.log.info('cron:walletSync:finished')
      } catch (e) {
        console.log(e)
      } finally {
        lock = false
      }
    }
  }, 15*60*1000); // 15 minutes timeout

   */
}
