export enum EvmChainsEnum {
  eth = 'eth',
  ropsten = 'ropsten',
  rinkeby = 'rinkeby',
  goerli = 'goerli',
  kovan = 'kovan',

  polygon = 'polygon',
  mumbai = 'mumbai',

  binance = 'binance',
  binance_testnet = 'binance_testnet',

  avalanche = 'avalanche',
  avalanche_testnet = 'avalanche_testnet',

  fantom = 'fantom',
}

export enum NearChainsEnum {
  near = 'near',
  near_testnet = 'near_testnet',
  near_betanet = 'near_betanet',
}

export enum MockChainsEnum {
  mock_chain = 'mock_chain',
  // manual_chain = 'manual_chain',
}

export type TChains = EvmChainsEnum | NearChainsEnum | MockChainsEnum;

export const Chains = { ...EvmChainsEnum, ...NearChainsEnum, ...MockChainsEnum };

export function baseChain(chain: TChains) {
  if (chain in EvmChainsEnum) {
    return EvmChainsEnum.eth;
  } else if (chain in NearChainsEnum) {
    return chain;
  } else {
    return chain;
  }
}

export enum TokenStandardsEnum {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
}
