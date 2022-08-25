import { expect } from 'chai';
import {
  IMoralisGetAddressNftResult,
  IMoralisGetAddressNftResultData,
  MoralisChains,
} from '../../../src/services/external/MoralisApi'
import {WalletAmountFactory} from '../../../src/services/walletAmount/WalletAmountFactory'
import {ITokenContract, IUserWallet} from '../../../src/logic/TokenOwnershipLogic'
import {TChains, TokenStandardsEnum} from '../../../src/lib/TChains'
import {MoralisWalletAmountAdapter} from '../../../src/services/walletAmount/MoralisWalletAmountAdapter'

const mockApp = (apiResultItems: IMoralisGetAddressNftResultData[]) => {
  return{
    MoralisApi: {
      getAddressNftToken: async (walletAddress: string, chain: MoralisChains, tokenAddress: string): Promise<IMoralisGetAddressNftResult> => {
        return {
          page: 0,
          page_size: 0,
          result: apiResultItems,
          total: apiResultItems.length,
        }
      },
    },
  };
}

const userWallet: IUserWallet = {address: '0x1111000000000000000000000000000000000000', chain: TChains.eth};

const tokenContract: ITokenContract = {
  address: '0xffff000000000000000000000000000000000000',
  chain: TChains.eth,
  standard: TokenStandardsEnum.ERC721,
};

describe('WalletAmountFactory#build', function () {
  it('returns amount returned by adapter', async () => {
    const factory = new WalletAmountFactory(mockApp([]));
    const adapter = factory.buildFor({
      wallet: userWallet,
      contract: tokenContract,
    })
    expect(adapter).to.be.an.instanceof(MoralisWalletAmountAdapter);
  });

  it('throws error if wallet chain is unknown', async () => {
    const factory = new WalletAmountFactory(mockApp([]));
    expect(() => {
      factory.buildFor({
        wallet: {...userWallet, chain: 'unknown_wallet_chain' as TChains},
        contract: tokenContract,
      })
    }).to.throw(/unknown_wallet_chain/);
  });

  it('throws error if contract chain is unknown', async () => {
    const factory = new WalletAmountFactory(mockApp([]));
    expect(() => {
      factory.buildFor({
        wallet: userWallet,
        contract: {...tokenContract, chain: 'unknown_contract_chain' as TChains},
      })
    }).to.throw(/unknown_contract_chain/);
  });
});
