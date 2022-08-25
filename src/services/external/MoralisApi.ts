import {BaseService} from '../BaseService';
import assert from 'assert';

export enum MoralisChains {
  eth = 'eth',
  ropsten = 'ropsten',
  rinkeby = 'rinkeby',
  goerli = 'goerli',
  kovan = 'kovan',

  polygon = 'polygon',
  mumbai = 'mumbai',

  binance = 'binance',
  'binance testnet' = 'binance testnet',

  avalanche = 'avalanche',
  'avalanche testnet' = 'avalanche testnet',

  fantom = 'fantom',
}

export interface IMoralisGetAddressNftResult {
  total: number,
  page: number,
  page_size: number,
  result: IMoralisGetAddressNftResultData[]
}

export interface IMoralisGetAddressNftResultData {
  token_address: string,
  token_id: string,
  block_number_minted: string,
  owner_of: string,
  block_number: string,
  amount: string,
  contract_type: 'ERC721' | 'ERC1155' | string,
  name: string,
  symbol: string,
  token_uri: string,
  metadata: string,
  synced_at: string, //2022-01-03T17:49:04.810Z,
  is_valid: number,
  syncing: number,
  frozen: number
}

export class MoralisApi extends BaseService {
  async getAddressNft(walletAddress: string, chain: MoralisChains) {
    assert(['polygon', 'eth'].includes(chain), `${chain} is not known`);

    const result = await this.app.axios.get<IMoralisGetAddressNftResult>(`https://deep-index.moralis.io/api/v2/${walletAddress}/nft?chain=${chain}&format=decimal`, {
      headers: {
        'X-API-Key': this.app.Env.moralisApiKey,
      },
    });

    return result.data;
  }

  async getAddressNftToken(walletAddress: string, chain: MoralisChains, tokenAddress: string) {
    assert(Object.keys(MoralisChains).includes(chain), `${chain} is not known`);

    const result = await this.app.axios.get<IMoralisGetAddressNftResult>(`https://deep-index.moralis.io/api/v2/${walletAddress}/nft/${tokenAddress}?chain=${chain}&format=decimal`, {
      headers: {
        'X-API-Key': this.app.Env.moralisApiKey,
      },
    });

    return result.data;
  }
}
