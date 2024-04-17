import {IAppConfig, IAppMutation$, ICallResult} from '../../interfaces/IClubApp'
import {EvmChainsEnum, TokenStandardsEnum} from '../../lib/TChains'
import {sanitizeHtmlDefault} from '../../lib/sanitize'
import Post from '../../models/Post'
import {feedAppEvents} from '../FeedApp/FeedAppConfig'
import MemberTokensUpdater from './lib/MemberTokensUpdater'
import {MotionActionState} from '../../engines/MotionEngine/models/MotionAction'
import Member from '../../models/Member'
import User from '../../models/User'

export const ethGatingActionTypes = {
  check: 'ethGating:check',
}

export const ethGatingEventTypes = {
  acquired: 'ethGating:acquired',
  withdrawn: 'ethGating:withdrawn',
  amountChanged: 'ethGating:amountChanged',
}

export const EthTokenGatingAppConfig: IAppConfig = {
  key: 'eth-gating',
  name: 'token-gating for Eth',
  description: 'token-gating for Ethereum-compatible blockchains',
  version: '1.0.0',
  coverImg: '/imgs/apps/eth-gating.jpg',
  tags: '#token-gating #eth #ethereum #polygon #bsc',
  events: {
    [ethGatingEventTypes.acquired]: {
      key: ethGatingEventTypes.acquired,
      name: 'token acquired',
      description: "triggers when user didn't own exact token (by tokenId) before a check",
      props: {},
      output: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
        memberToken: {
          key: 'memberToken',
          type: 'object',
          label: 'memberToken',
          description: 'member token data',
        },
        previousAmount: {
          key: 'previousAmount',
          type: 'number',
          label: 'previous amount',
          description: 'previous amount of token held by member',
        }
      }
    },
    [ethGatingEventTypes.withdrawn]: {
      key: ethGatingEventTypes.withdrawn,
      name: 'token withdrawn',
      description: "triggers when member doesn't own exact token (by tokenId) anymore",
      props: {},
      output: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
        memberToken: {
          key: 'memberToken',
          type: 'object',
          label: 'memberToken',
          description: 'member token data',
        },
        previousAmount: {
          key: 'previousAmount',
          type: 'number',
          label: 'previous amount',
          description: 'previous amount of token held by member',
        }
      }
    },
    [ethGatingEventTypes.amountChanged]: {
      key: ethGatingEventTypes.amountChanged,
      name: 'amount changed',
      description: "only triggers when exact token amount (by tokenId) is changed from/to non-zero value (works for fungible and semi-fungible tokens)",
      props: {},
      output: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
        memberToken: {
          key: 'memberToken',
          type: 'object',
          label: 'member token',
          description: 'member token data',
        },
        previousAmount: {
          key: 'previousAmount',
          type: 'number',
          label: 'previous amount',
          description: 'previous amount of token held by member',
        }
      }
    },
  },
  actions: {
    [ethGatingActionTypes.check]: {
      key: ethGatingActionTypes.check,
      name: 'check member tokens',
      description: 'updates list of member\'s tokens and triggers events',
      props: {},
      input: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
      },
      call: async ($: IAppMutation$, data): Promise<ICallResult> => {
        // todo: use member only
        const user = await $.app.m.findOneByOrFail(User, {id: $.member.userId});

        const updater = new MemberTokensUpdater($.app, $.clubApp, user, $.member, $.club);
        return { state: MotionActionState.done, data: await updater.updateMemberTokens() };
      }
    }
  },
  config: {
    props: {
      chain: {
        key: 'chain',
        type: 'string',
        editor: {
          type: 'select',
        },
        label: 'chain',
        description: 'token blockchain',
        values: [
          {value: EvmChainsEnum.eth, label: 'Ethereum', img: ''},
          {value: EvmChainsEnum.polygon, label: 'Polygon', img: ''},
          {value: EvmChainsEnum.bsc, label: 'BSC', img: ''},
          {value: EvmChainsEnum.avalanche, label: 'Avalanche', img: ''},
          {value: EvmChainsEnum.fantom, label: 'Fantom', img: ''},
          {value: EvmChainsEnum.palm, label: 'Palm', img: ''},
          {value: EvmChainsEnum.cronos, label: 'Cronos', img: ''},
          {value: EvmChainsEnum.arbitrum, label: 'Arbitrum', img: ''},

          {value: EvmChainsEnum.sepolia, label: 'Sepolia testnet', img: ''},
          {value: EvmChainsEnum.goerli, label: 'Goerli testnet', img: ''},
          {value: EvmChainsEnum.mumbai, label: 'Mumbai testnet', img: ''},
          {value: EvmChainsEnum.bsc_testnet, label: 'BSC testnet', img: ''},
          {value: EvmChainsEnum.avalanche_testnet, label: 'Avalanche testnet', img: ''},
          {value: EvmChainsEnum.cronos_testnet, label: 'Cronos testnet', img: ''},
        ],
        required: true,
      },
      contractAddress: {
        key: 'contractAddress',
        type: 'string',
        label: 'contract address',
        description: 'address of token contract',
        default: '',
        required: true,
      },
      contractType: {
        key: 'contractType',
        type: 'string',
        editor: {
          type: 'select',
        },
        label: 'contract type',
        description: 'standard used for token',
        values: [
          {value: TokenStandardsEnum.ERC721, label: 'ERC721'},
          {value: TokenStandardsEnum.ERC1155, label: 'ERC1155'},
          // {value: TokenStandardsEnum.ERC20, label: 'ERC20'},
        ],
        required: true,
      },
    },
  },
};
