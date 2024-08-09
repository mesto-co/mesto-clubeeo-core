import App from '../../../App';
import {obj, str} from 'json-schema-blocks';
import {MoreThan} from 'typeorm';
import {StatusCodes} from 'http-status-codes'
import Wallet from '../../../models/Wallet'
import {EvmChainsEnum, TokenStandardsEnum} from '../../../lib/TChains'
import {MemberToken} from '../../../models/MemberToken'
import {toChecksumAddress} from '../../../lib/web3helpers'
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

      return result;
    });

    next();
  }

}
