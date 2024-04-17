import {BaseService} from '../BaseService';
import assert from 'assert';
import App, {NoDBContainer} from '../../App'

export enum MoralisChains {
  eth = 'eth',
  ropsten = 'ropsten',
  rinkeby = 'rinkeby',
  goerli = 'goerli',
  kovan = 'kovan',

  polygon = 'polygon',
  mumbai = 'mumbai',

  bsc = 'bsc',
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

export interface IMoralisGetBalanceResult {
  balance: string
}

export interface IMoralisGetErc20ResultItem {
  token_address: string,
  name: string,
  symbol: string,
  logo: string,
  thumbnail: string,
  decimals: number,
  balance: string
}

export interface IMoralisGetErc20PriceResult {
  nativePrice: {
    value: number,
    decimals: number,
    name: string,
    symbol: string
  },
  usdPrice: number,
  exchangeAddress: string,
  exchangeName: string,
}


function assertChain(chain: MoralisChains) {
  assert(Object.keys(MoralisChains).includes(chain), `${chain} is not known`);
}

const moralisUrl = 'https://deep-index.moralis.io';

export class MoralisApi {
  protected app: NoDBContainer

  constructor(app: NoDBContainer) {
    this.app = app
  }

  async getAddressNft(walletAddress: string, chain: MoralisChains) {
    assertChain(chain);

    const result = await this.app.axios.get<IMoralisGetAddressNftResult>(`${moralisUrl}/api/v2/${walletAddress}/nft?chain=${chain}&format=decimal`, {
      headers: {
        'X-API-Key': this.app.Env.moralisApiKey,
      },
    });

    return result.data;
  }

  async getBalance(walletAddress: string, chain: MoralisChains) {
    assertChain(chain);

    const result = await this.app.axios.get<IMoralisGetBalanceResult>(`${moralisUrl}/api/v2/${walletAddress}/balance?chain=${chain}`, {
      headers: {
        'X-API-Key': this.app.Env.moralisApiKey,
      },
    });

    return result.data;
  }

  async getErc20(walletAddress: string, chain: MoralisChains) {
    assertChain(chain);

    const result = await this.app.axios.get<IMoralisGetErc20ResultItem>(`${moralisUrl}/api/v2/${walletAddress}/erc20?chain=${chain}&format=decimal`, {
      headers: {
        'X-API-Key': this.app.Env.moralisApiKey,
      },
    });

    return result.data;
  }

  async getErc20Price(chain: MoralisChains, tokenAddress: string) {
    assertChain(chain);

    const result = await this.app.axios.get<IMoralisGetErc20PriceResult>(`${moralisUrl}/api/v2/erc20/${tokenAddress}/price?chain=${chain}`, {
      headers: {
        'X-API-Key': this.app.Env.moralisApiKey,
      },
    });

    return result.data;
  }

  async getAddressNftToken(walletAddress: string, chain: MoralisChains, tokenAddress: string) {
    assertChain(chain);

    const result = await this.app.axios.get<IMoralisGetAddressNftResult>(`${moralisUrl}/api/v2/${walletAddress}/nft/${tokenAddress}?chain=${chain}&format=decimal`, {
      headers: {
        'X-API-Key': this.app.Env.moralisApiKey,
      },
    });

    return result.data;
  }
}
