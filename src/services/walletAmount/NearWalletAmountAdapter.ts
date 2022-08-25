import {toChecksumAddress} from '../../lib/web3helpers'
import {ITokenContract, IUserWallet} from '../../logic/TokenOwnershipLogic'
import {IMoralisGetAddressNftResult, MoralisChains} from '../external/MoralisApi'
import {EvmChainsEnum, NearChainsEnum} from '../../lib/TChains'
import {IWalletAmountAdapter} from './walletAmountInterfaces'
import {InMemoryKeyStore} from 'near-api-js/lib/key_stores/in_memory_key_store'
import getNearConfig from '../../lib/near/config'
import {connect, Contract} from 'near-api-js'

export const chainToNearChainMap = new Map([
  [NearChainsEnum.near, 'mainnet'],
  [NearChainsEnum.near_testnet, 'testnet'],
  [NearChainsEnum.near_betanet, 'betanet'],
]);

export interface INearWalletAmountServiceDeps {

}

interface INearNFTEntry {
  token_id: string,
  owner_id: string,
  approved_account_ids: Record<string, string>,
  metadata: Record<string, string | number | null>,
  // metadata:  {
  //   title: 'Some Art',
  //   description: 'My NFT media',
  //   media: 'https://bafkreiabag3ztnhe5pg7js4bj6sxuvkz3sdf76cjvcuqjoidvnfjz7vwrq.ipfs.dweb.link/',
  //   media_hash: null,
  //   copies: 1,
  //   issued_at: null,
  //   expires_at: null,
  //   starts_at: null,
  //   updated_at: null,
  //   extra: null,
  //   reference: null,
  //   reference_hash: null
  // },
}

export class NearWalletAmountAdapter implements IWalletAmountAdapter {
  protected app: INearWalletAmountServiceDeps

  constructor(app: INearWalletAmountServiceDeps) {
    this.app = app
  }

  async getWalletTokenAmount(userWallet: IUserWallet, tokenContract: ITokenContract) {
    const keyStore = new InMemoryKeyStore();

    const config = {
      ...getNearConfig(chainToNearChainMap.get(tokenContract.chain as NearChainsEnum)),
      keyStore,
    }

    const near = await connect(config);

    const account = await near.account(tokenContract.address);

    const contract = new Contract(
      account, // the account object that is connecting
      tokenContract.address,
      {
        // name of contract you're connecting to
        viewMethods: ["nft_tokens_for_owner"], // view methods do not change state but usually return a value
        changeMethods: [""], // change methods modify state
      }
    );

    // @ts-ignore
    const response = await contract.nft_tokens_for_owner({
      account_id: userWallet.address
    }) as Array<INearNFTEntry>;

    console.log(response)

    return response.length;
  }

}
