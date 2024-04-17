import App from '../../../App';
import {arr, id, obj, str} from 'json-schema-blocks';
import User from '../../../models/User';
import {ILike, In, MoreThan, Not} from 'typeorm';
import {UserExtMessageBatch} from '../../../models/UserExtMessageBatch';
import {sanitizeHtmlDefault} from '../../../lib/sanitize';
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'
import {StatusCodes} from 'http-status-codes'
import ClubBadge from '../../../models/ClubBadge'
import MemberBadge from '../../../models/MemberBadge'
import {MoralisApi} from '../../../services/external/MoralisApi'
import Wallet from '../../../models/Wallet'
import {EvmChainsEnum, TokenStandardsEnum} from '../../../lib/TChains'
import Member from '../../../models/Member'
import {MemberToken} from '../../../models/MemberToken'
import {toChecksumAddress} from '../../../lib/web3helpers'
import fromEntries from 'fromentries'
import {ethGatingEventTypes} from '../EthWalletAppConfig'
import MemberTokensUpdater from '../lib/MemberTokensUpdater'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/:appId/ethGating', {
      params: obj({
        clubId: str(1),
        appId: str(1),
      })
    }, async (request, reply) => {
      const memberCtx = await app.auth.getUserInClubContext(request);
      const {club, user} = memberCtx;
      const {value: member} = await memberCtx.fetchMember();

      const clubApp = await app.repos.clubApp.findById(club, request.params.appId);
      if (!clubApp || !await app.engines.accessEngine.userHasAccessToApp(user, clubApp)) {
        return reply.code(StatusCodes.FORBIDDEN).send({ error: 'access denied' });
      }

      if (clubApp.appName !== 'eth-gating') return reply.code(StatusCodes.NOT_ACCEPTABLE).send({ error: 'wrong app' });
      const appConfig = clubApp.config;
      const contractAddress = toChecksumAddress(appConfig['contractAddress']);
      const chain = appConfig['chain'];

      const wallet = await app.m.findOne(Wallet,{
        where: {
          user: {id: user.id},
          chain: EvmChainsEnum.eth,
        },
        order: {
          id: 'DESC'
        }
      });
      const walletAddress = toChecksumAddress(wallet.address);

      const memberTokens = await app.m.find(MemberToken, {
        where: {
          amount: MoreThan(0),
          member: {id: member.id},
          contractAddress,
          walletAddress,
          chain,
        },
      });

      return {
        wallet,
        memberTokens,
      }
    });

    router.post('/:appId/ethGating/verify', {
      params: obj({
        clubId: str(1),
        appId: str(1),
      })
    }, async (request, reply) => {
      const memberCtx = await app.auth.getUserInClubContext(request);
      const {club, user} = memberCtx;
      const {value: member} = await memberCtx.fetchMember();

      const clubApp = await app.repos.clubApp.findById(club, request.params.appId);
      if (!clubApp || !await app.engines.accessEngine.userHasAccessToApp(user, clubApp)) {
        return reply.code(StatusCodes.FORBIDDEN).send({ error: 'access denied' });
      }

      if (clubApp.appName !== 'eth-gating') return reply.code(StatusCodes.NOT_ACCEPTABLE).send({ error: 'wrong app' });

      const updater = new MemberTokensUpdater(app, clubApp, user, member, club);
      const result = updater.updateMemberTokens();

      // const appConfig = clubApp.config;
      // const contractAddress = toChecksumAddress(appConfig['contractAddress']);
      // const chain = appConfig['chain'];
      //
      // const wallet = await app.m.findOne(Wallet,{
      //   where: {
      //     user: {id: user.id},
      //     chain: EvmChainsEnum.eth,
      //   },
      //   order: {
      //     id: 'DESC'
      //   }
      // });
      // const walletAddress = toChecksumAddress(wallet.address);
      //
      // const result = await app.MoralisApi.getAddressNftToken(wallet.address, chain, contractAddress);
      // const currentTokens = result.result;
      //
      // const memberTokens = await app.m.find(MemberToken, {
      //   where: {
      //     member: {id: member.id},
      //     contractAddress,
      //     walletAddress,
      //     chain,
      //   },
      // });
      //
      // const memberTokensByTokenId = fromEntries(memberTokens.map(mt => [mt.tokenId, mt]));
      //
      // const checkedTokens = {};
      //
      // for (const currentToken of currentTokens) {
      //   const tokenId = currentToken.token_id;
      //
      //   // check token is already stored
      //   let memberToken = memberTokensByTokenId[tokenId];
      //   if (!memberToken) {
      //     memberToken = app.m.create(MemberToken, {
      //       amount: 0,
      //       contractAddress,
      //       tokenId,
      //       walletAddress,
      //       chain,
      //       wallet,
      //       club,
      //       member,
      //       user,
      //       data: {type: 'moralis-nft', ...currentToken, metadata: null},
      //       metadata: JSON.parse(currentToken.metadata),
      //     });
      //   }
      //
      //   checkedTokens[memberToken.id] = memberToken;
      //
      //   const checkMemberToken = async (memberToken: MemberToken) => {
      //     // check if amount is changed
      //     const newAmount = Number(currentToken.amount);
      //     const previousAmount = memberToken.amount;
      //     if (memberToken.amount !== Number(currentToken.amount)) {
      //       memberToken.amount = Number(currentToken.amount);
      //       await app.m.save(memberToken)
      //
      //       if (memberToken.amount === 0) {
      //         // token acquired
      //         await app.engines.motionEngine.processEvent(
      //           ethGatingEventTypes.acquired,
      //           { club, clubApp, member },
      //           { memberToken, previousAmount },
      //         );
      //       } else if (newAmount === 0) {
      //         // token sold
      //         await app.engines.motionEngine.processEvent(
      //           ethGatingEventTypes.withdrawn,
      //           { club, clubApp, member },
      //           { memberToken, previousAmount },
      //         );
      //       } else {
      //         // amount changed
      //         await app.engines.motionEngine.processEvent(
      //           ethGatingEventTypes.amountChanged,
      //           { club, clubApp, member },
      //           { memberToken, previousAmount },
      //         );
      //       }
      //     }
      //   }
      //
      //   await checkMemberToken(memberToken);
      // }

      return result;
    });

    next();
  }

}
