import {Web3ProviderFactory} from './Web3ProviderFactory'
import {HttpProviderBase} from 'web3-core-helpers'
import Web3 from 'web3'
import {EthSignatureVerificationService} from './EthSignatureVerificationService'

export default class AppWeb3 {
  // singleton
  private static instance: AppWeb3

  /**
   * Get instance
   */
  public static getInstance(): AppWeb3 {
    if (!AppWeb3.instance) {
      AppWeb3.instance = new AppWeb3();
    }

    return AppWeb3.instance;
  }

  protected _ethProvider: HttpProviderBase;
  get ethProvider() {
    return this._ethProvider || (this._ethProvider = new Web3ProviderFactory().eth());
  }

  protected _ethWeb3: Web3;
  get ethWeb3() {
    return this._ethWeb3 || (this._ethWeb3 = new Web3(this.ethProvider));
  }

  protected _EthSignatureVerificationService: EthSignatureVerificationService;
  get EthSignatureVerificationService() {
    return this._EthSignatureVerificationService || (this._EthSignatureVerificationService = new EthSignatureVerificationService(this));
  }
}
