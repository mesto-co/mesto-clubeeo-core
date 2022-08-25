import {BaseService} from '../../services/BaseService'
import {TChains} from '../../lib/TChains'
import {WalletNft} from '../WalletNft'
import Wallet from '../Wallet'
import TokenContract from '../TokenContract'
import {WalletNftEvent, WalletNftEventsEnum} from '../WalletNftEvent'
import {IWalletNftCreateOrUpdate, IWalletNftFindBy} from './repoInterfaces'

export default class WalletNftRepo
  extends BaseService
  implements IWalletNftCreateOrUpdate, IWalletNftFindBy
{

  async createOrUpdate(params: {
    walletAddress: string,
    contractAddress: string,
    chain: TChains,
    ownedAmount: number,
  }) {
    let previousAmount = 0;

    let walletNft = await this.app.m.findOne(WalletNft, {
      where: {
        walletAddress: params.walletAddress,
        contractAddress: params.contractAddress,
        chain: params.chain,
      },
      relations: ['wallet', 'tokenContract']
    });
    if (!walletNft) {
      const wallet = await this.app.m.findOneBy(Wallet, {
        address: params.walletAddress,
        // chain,
      });

      const tokenContract = await this.app.m.findOneBy(TokenContract, {
        address: params.contractAddress,
        chain: params.chain,
      });

      walletNft = this.app.m.create(WalletNft, {
        walletAddress: params.walletAddress,
        contractAddress: params.contractAddress,
        chain: params.chain,
        wallet,
        tokenContract,
      });
    } else {
      previousAmount = walletNft.ownedAmount;
    }
    walletNft.ownedAmount = params.ownedAmount;
    await this.app.m.save(walletNft);

    const walletNftEvent = this.app.m.create(WalletNftEvent, {
      ownedAmount: walletNft.ownedAmount,
      previousAmount,
      walletAddress: walletNft.walletAddress,
      contractAddress: walletNft.contractAddress,
      chain: walletNft.chain,
      walletNft,
      wallet: walletNft.wallet,
      tokenContract: walletNft.tokenContract,
    });

    if (walletNft.ownedAmount === 0 && previousAmount !== 0) {
      walletNftEvent.event = WalletNftEventsEnum.sold;
    } else if (previousAmount === 0) {
      walletNftEvent.event = WalletNftEventsEnum.acquired;
    } else if (params.ownedAmount != previousAmount) {
      if (walletNft.ownedAmount > previousAmount) {
        walletNftEvent.event = WalletNftEventsEnum.amountIncreased;
      } else if (walletNft.ownedAmount < previousAmount) {
        walletNftEvent.event = WalletNftEventsEnum.amountDecreased;
      }
    } else {
      // triggered when updated without amount change
      walletNftEvent.event = WalletNftEventsEnum.notChanged;
    }
    await this.app.m.save(walletNftEvent);

    // switch (walletNftEvent.event) {
    //   case WalletNftEventsEnum.acquired:
    //     this.app.tokenEvents.emit('tokenIsAcquired', {walletNft});
    //     break;
    //   case WalletNftEventsEnum.sold:
    //     this.app.tokenEvents.emit('tokenIsSold', {walletNft, previousAmount});
    //     break;
    //   case WalletNftEventsEnum.amountIncreased:
    //     this.app.tokenEvents.emit('tokenAmountIncreased', {walletNft, previousAmount});
    //     break;
    //   case WalletNftEventsEnum.amountDecreased:
    //     this.app.tokenEvents.emit('tokenAmountDecreased', {walletNft, previousAmount});
    //     break;
    //   default:
    //     break;
    // }

    return walletNft;
  }

  async findBy(params: {
    walletAddress: string,
    contractAddress: string,
    chain: TChains,
  }) {
    return await this.app.m.findOneBy(WalletNft, {
      walletAddress: params.walletAddress,
      contractAddress: params.contractAddress,
      chain: params.chain,
    });
  }
}

