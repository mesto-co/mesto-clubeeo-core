import {BaseAppWeb3Service} from './BaseAppWeb3Service'

export class EthSignatureVerificationService extends BaseAppWeb3Service {

  async verify(opts: {nonce: string, signature: string, address: string}) {
    const web3 = this.appWeb3.ethWeb3;
    const signing_address = await web3.eth.accounts.recover(opts.nonce, opts.signature)
    return signing_address === opts.address;
  }

}
