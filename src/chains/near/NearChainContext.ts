import {AbstractChainContext} from '../base/AbstractChainContext'

export class NearChainContext extends AbstractChainContext {
  normAddress(address: string): string {
    return address;
  }

  async signatureVerify(opts: {nonce: string, signature: string, address: string}) {
    return Promise.resolve(true); //todo: actual checks
  }
}
