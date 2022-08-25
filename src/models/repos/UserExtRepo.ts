import {BaseService} from '../../services/BaseService'
import {WalletNft} from '../WalletNft'
import Wallet from '../Wallet'
import User from '../User'
import UserExt from '../UserExt'
import {ExtService} from '../../lib/enums'

export class UserExtRepo extends BaseService {
  async findOneByWalletNft(walletNft: WalletNft, service: ExtService) {
    const m = this.app.m;

    const wallet = walletNft.wallet || await m.findOneBy(Wallet, {
      id: walletNft.walletId
    });
    if (!wallet) return null;

    const walletUser = wallet.user || await m.findOneByOrFail(User, {
      id: wallet.userId
    });
    if (!walletUser) return null;

    return await m.findOneBy(UserExt, {
      service,
      user: {id: walletUser.id},
      enabled: true,
    });
  }
}
