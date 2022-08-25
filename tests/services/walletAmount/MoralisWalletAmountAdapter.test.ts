import {ITokenContract, IUserWallet} from '../../../src/logic/TokenOwnershipLogic'
import {EvmChainsEnum, TokenStandardsEnum} from '../../../src/lib/TChains'
import {MoralisWalletAmountAdapter} from '../../../src/services/walletAmount/MoralisWalletAmountAdapter'
import {
  IMoralisGetAddressNftResult,
  IMoralisGetAddressNftResultData,
  MoralisChains,
} from '../../../src/services/external/MoralisApi'
import { expect } from 'chai'

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

const userWallet: IUserWallet = {address: '0x1111000000000000000000000000000000000000', chain: EvmChainsEnum.eth};

const tokenContract: ITokenContract = {
  address: '0xffff000000000000000000000000000000000000',
  chain: EvmChainsEnum.eth,
  standard: TokenStandardsEnum.ERC721,
  config: {}
};

describe('MoralisWalletAmountAdapter#getWalletTokenAmount', function () {
  it('returns 0 if there is no tokens on wallet', async () => {
    const adapter = new MoralisWalletAmountAdapter(mockApp([]));
    const ownedAmount = await adapter.getWalletTokenAmount(userWallet, tokenContract);
    expect(ownedAmount).eq(0);
  });

  it('returns 1 if there is one token on wallet', async () => {
    const adapter = new MoralisWalletAmountAdapter(mockApp([mockMoralisTokenData()]));
    const ownedAmount = await adapter.getWalletTokenAmount(userWallet, tokenContract);
    expect(ownedAmount).eq(1);
  });

  it('returns amount if there is multiple tokens on wallet', async () => {
    const adapter = new MoralisWalletAmountAdapter(mockApp(
      [mockMoralisTokenData(), mockMoralisTokenData(), mockMoralisTokenData()]
    ));
    const ownedAmount = await adapter.getWalletTokenAmount(userWallet, tokenContract);
    expect(ownedAmount).eq(3);
  });

  it('returns amount sum for semi-fungible tokens', async () => {
    const adapter = new MoralisWalletAmountAdapter(mockApp([
      {...mockMoralisTokenData(), amount: '2'},
      {...mockMoralisTokenData(), amount: '3'},
    ]));
    const ownedAmount = await adapter.getWalletTokenAmount(userWallet, tokenContract);

    expect(ownedAmount).eq(5);
  });

  it('filters tokens by token_id prefix', async () => {
    const adapter = new MoralisWalletAmountAdapter(mockApp([
      {...mockMoralisTokenData(), token_id: '001001'},
      {...mockMoralisTokenData(), token_id: '100002'},
      {...mockMoralisTokenData(), token_id: '100003'},
      {...mockMoralisTokenData(), token_id: '001004'},
      {...mockMoralisTokenData(), token_id: '001005'},
    ]));
    const contractWithConfig = {
      ...tokenContract,
      config: {
        tokenIdPrefix: '001'
      }
    }
    const ownedAmount = await adapter.getWalletTokenAmount(userWallet, contractWithConfig);
    expect(ownedAmount).eq(3);

    const contractWithConfig2 = {
      ...tokenContract,
      config: {
        tokenIdPrefix: '100'
      }
    }
    const ownedAmount2 = await adapter.getWalletTokenAmount(userWallet, contractWithConfig2);
    expect(ownedAmount2).eq(2);
  });
});
