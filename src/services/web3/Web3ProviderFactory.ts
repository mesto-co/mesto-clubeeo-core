import Web3 from 'web3'

export class Web3ProviderFactory {
  eth() {
    // https://ethereumnodes.com/
    return new Web3.providers.HttpProvider('https://cloudflare-eth.com/');
  }
}
