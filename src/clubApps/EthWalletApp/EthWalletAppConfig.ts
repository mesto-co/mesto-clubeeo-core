import {IAppConfig} from '../../interfaces/IClubApp'

export const ethWalletEventTypes = {
  login: 'ethWallet:login',
}

export const EthWalletAppConfig: IAppConfig = {
  key: 'eth-wallet',
  name: 'login with Eth wallet',
  description: 'login with Ethereum-compatible wallet',
  version: '1.0.0',
  coverImg: '/imgs/apps/eth-wallet.jpg',
  tags: '#login #eth',
  events: {
    [ethWalletEventTypes.login]: {
      key: ethWalletEventTypes.login,
      name: 'logged in',
      description: 'triggers when member logs in',
      props: {},
      output: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        }
      }
    },
  },
  actions: {},
  config: {
    props: {},
  },
};
