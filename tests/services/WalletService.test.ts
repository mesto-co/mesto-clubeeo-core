import {simplePaginator} from '../../src/lib/crudHelpers';
import {expect} from 'chai';
import WalletService from '../../src/services/WalletService'
import {ITokenContract, IUserWallet} from '../../src/logic/TokenOwnershipLogic'
import {Chains, EvmChainsEnum, TChains, TokenStandardsEnum} from '../../src/lib/TChains'
import {
  IMoralisGetAddressNftResult,
  IMoralisGetAddressNftResultData,
  MoralisApi,
  MoralisChains,
} from '../../src/services/external/MoralisApi'
import {IWalletAmountAdapter} from '../../src/services/walletAmount/WalletAmountInterfaces'
import {MoralisWalletAmountAdapter} from '../../src/services/walletAmount/MoralisWalletAmountAdapter'
import {WalletNft} from '../../src/models/WalletNft'
import {AbstractChainContext} from '../../src/chains/base/AbstractChainContext'
import {DummyChainContext} from '../../src/chains/dummy/DummyChainContext'


const mockMoralisTokenData = () => {
  return {
    token_address: '0xffff000000000000000000000000000000000000',
    token_id: '0100',
    block_number_minted: '',
    owner_of: '',
    block_number: '',
    amount: '1',
    contract_type: 'ERC721',
    name: '',
    symbol: '',
    token_uri: '',
    metadata: '',
    synced_at: '2022-01-03T17:49:04.810Z',
    is_valid: 1,
    syncing: 0,
    frozen: 0,
  }
}

const testWalletServiceFactory = (opts: {
  walletAmount: number
}) => {
  return new WalletService({
    walletAmountFactory: {
      buildFor: (params: { wallet: IUserWallet, contract: ITokenContract }) => {
        return {
          getWalletTokenAmount: async (userWallet: IUserWallet, tokenContract: ITokenContract): Promise<number> => {
            return opts.walletAmount;
          }
        }
      }
    },
    repos: {
      walletNft: {
        createOrUpdate: async (params: { walletAddress: string, contractAddress: string, chain: TChains, ownedAmount: number }): Promise<WalletNft> => {
          return
        },
        findBy: async (params: { walletAddress: string, contractAddress: string, chain: TChains }): Promise<WalletNft> => {
          return
        }
      },
    },
    contexts: {
      chain: (chain: TChains): AbstractChainContext => {
        return new DummyChainContext();
      },
    }
  });
}

const userWallet: IUserWallet = {address: '0x1111000000000000000000000000000000000000', chain: EvmChainsEnum.eth};

const tokenContract: ITokenContract = {
  address: '0xffff000000000000000000000000000000000000',
  chain: Chains.eth,
  standard: TokenStandardsEnum.ERC721,
  config: {}
};

describe('WalletService#syncWalletTokenAmount', function () {
  it('returns amount returned by adapter', async () => {
    const walletService = testWalletServiceFactory({walletAmount: 10});
    const ownedAmount = await walletService.syncWalletTokenAmount(userWallet, tokenContract);
    expect(ownedAmount).eq(10);

    const walletService2 = testWalletServiceFactory({walletAmount: 0});
    const ownedAmount2 = await walletService2.syncWalletTokenAmount(userWallet, tokenContract);
    expect(ownedAmount2).eq(0);
  });

  // it('throws error if wallet chain is unknown', async () => {
  //   const walletService = testWalletServiceFactory({walletAmount: 10});
  //   expect(async () => {
  //     await walletService.syncWalletTokenAmount({...userWallet, chain: 'unknown' as ChainsEnum}, tokenContract);
  //   }).to.throw('Property does not exist in model schema.');
  // });
});
