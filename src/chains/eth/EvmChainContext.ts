import {toChecksumAddress} from '../../lib/web3helpers'
import {AbstractChainContext} from '../base/AbstractChainContext'
import App from '../../App'

export class EvmChainContext extends AbstractChainContext {
  readonly app: App;

  constructor(app: App) {
    super();
    this.app = app;
  }

  normAddress(address: string): string {
    return toChecksumAddress(address);
  }

  async signatureVerify(opts: {nonce: string, signature: string, address: string}) {
    return await this.app.AppWeb3.EthSignatureVerificationService.verify(opts);
  }
}
