// const CONTRACT_NAME = process.env.CONTRACT_NAME || 'wallet-example'; /* TODO: fill this in! */
import { ConnectConfig } from 'near-api-js/lib/browser-connect';

// const CONTRACT_NAME = 'wallet-example';
const CONTRACT_NAME = 'guest-book.testnet';
const HOME = 'wallet-example';

export default function getNearConfig (env: string): ConnectConfig & {contractName?: string} {
  switch (env) {
    case 'production':
    case 'mainnet':
      return {
        networkId: 'mainnet',
        nodeUrl: 'https://rpc.mainnet.near.org',
        // contractName: CONTRACT_NAME,
        walletUrl: 'https://wallet.near.org',
        helperUrl: 'https://helper.mainnet.near.org',
        headers: {}
      }
    case 'development':
    case 'testnet':
      return {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        // contractName: CONTRACT_NAME,
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        headers: {}
      }
    case 'betanet':
      return {
        networkId: 'betanet',
        nodeUrl: 'https://rpc.betanet.near.org',
        // contractName: CONTRACT_NAME,
        walletUrl: 'https://wallet.betanet.near.org',
        helperUrl: 'https://helper.betanet.near.org',
        headers: {}
      }
    case 'local':
      return {
        networkId: 'local',
        nodeUrl: 'http://localhost:3030',
        keyPath: `${HOME}/.near/validator_key.json`,
        walletUrl: 'http://localhost:4000/wallet',
        // contractName: CONTRACT_NAME,
        headers: {}
      }
    case 'test':
    case 'ci':
      return {
        networkId: 'shared-test',
        nodeUrl: 'https://rpc.ci-testnet.near.org',
        contractName: CONTRACT_NAME,
        masterAccount: 'test.near',
        headers: {}
      }
    case 'ci-betanet':
      return {
        networkId: 'shared-test-staging',
        nodeUrl: 'https://rpc.ci-betanet.near.org',
        // contractName: CONTRACT_NAME,
        masterAccount: 'test.near',
        headers: {}
      }
    default:
      throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
  }
}
