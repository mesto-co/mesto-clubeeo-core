import {toChecksumAddress} from '../../../lib/web3helpers'
import Wallet from '../../../models/Wallet'
import {EvmChainsEnum} from '../../../lib/TChains'
import {MemberToken} from '../../../models/MemberToken'
import fromEntries from 'fromentries'
import {ethGatingEventTypes} from '../EthWalletAppConfig'
import ClubApp from '../../../engines/AppEngine/models/ClubApp'
import App from '../../../App'
import User from '../../../models/User'
import Member from '../../../models/Member'
import Club from '../../../models/Club'

export default class MemberTokensUpdater {
  protected app: App;
  protected clubApp: ClubApp;
  protected user: User;
  protected member: Member;
  protected club: Club;

  constructor(app: App, clubApp: ClubApp, user: User, member: Member, club: Club) {
    this.app = app;
    this.clubApp = clubApp;
    this.user = user;
    this.member = member;
    this.club = club;
  }

  async checkMemberToken(memberToken: MemberToken, currentToken: {amount: string}) {
    // check if amount is changed
    const newAmount = Number(currentToken.amount);
    const previousAmount = memberToken.amount;
    if (memberToken.amount !== Number(currentToken.amount)) {
      memberToken.amount = Number(currentToken.amount);
      await this.app.m.save(memberToken);
      const eventOpts = {club: this.club, clubApp: this.clubApp, member: this.member};
      const eventData = {memberToken, previousAmount, member: this.member};

      if (memberToken.amount === 0) {
        // token acquired
        await this.app.engines.motionEngine.processEvent(
          ethGatingEventTypes.acquired, eventOpts, eventData,
        );
      } else if (newAmount === 0) {
        // token sold
        await this.app.engines.motionEngine.processEvent(
          ethGatingEventTypes.withdrawn, eventOpts, eventData,
        );
      } else {
        // amount changed
        await this.app.engines.motionEngine.processEvent(
          ethGatingEventTypes.amountChanged, eventOpts, eventData,
        );
      }
    }
  }

  async updateMemberTokens() {
    const appConfig = this.clubApp.config;
    const contractAddress = toChecksumAddress(appConfig['contractAddress']);
    const chain = appConfig['chain'];

    const wallet = await this.app.m.findOne(Wallet, {
      where: {
        // todo: change to member
        user: {id: this.user.id},
        chain: EvmChainsEnum.eth,
      },
      order: {
        id: 'DESC',
      },
    });
    const walletAddress = toChecksumAddress(wallet.address);

    // const result = await this.app.MoralisApi.getAddressNftToken(wallet.address, chain, contractAddress);
    // const currentTokens = result.result;
    const currentTokens = [];

    const memberTokens = await this.app.m.find(MemberToken, {
      where: {
        member: {id: this.member.id},
        contractAddress,
        walletAddress,
        chain,
      },
    });

    const memberTokensByTokenId = fromEntries(memberTokens.map(mt => [mt.tokenId, mt]));

    const checkedTokens = {};

    for (const currentToken of currentTokens) {
      const tokenId = currentToken.token_id;

      // check token is already stored
      let memberToken = memberTokensByTokenId[tokenId];
      if (!memberToken) {
        memberToken = this.app.m.create(MemberToken, {
          amount: 0,
          contractAddress,
          tokenId,
          walletAddress,
          chain,
          wallet,
          club: this.club,
          member: this.member,
          user: this.user,
          data: {type: 'moralis-nft', ...currentToken, metadata: null},
          metadata: JSON.parse(currentToken.metadata),
        });
      }

      checkedTokens[memberToken.id] = memberToken;

      await this.checkMemberToken(memberToken, currentToken);
    }

    return {
      checkedTokens,
    }
  }
}
