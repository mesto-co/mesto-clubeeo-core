import {BaseService} from './services/BaseService'
import {AuthContext, IAuthContextRequest} from './contexts/AuthContext'
import {TChains} from './lib/TChains'
import {chainContextFactory} from './contexts/ChainContext'
import Club from './models/Club'
import {ClubContext} from './contexts/ClubContext'
import User from './models/User'
import {UserContext} from './contexts/UserContext'
import UserInClubContext from './contexts/UserInClubContext'
import Wallet from './models/Wallet'
import {WalletContext} from './contexts/WalletContext'
import TokenContract from './models/TokenContract'
import {ContractContext} from './contexts/ContractContext'
import {ContractWalletContext} from './contexts/ContractWalletContext'
import {ClubAppContext} from './contexts/ClubAppContext'
import ClubExt from './models/ClubExt'
import Member from './models/Member'
import ClubApp from './engines/AppEngine/models/ClubApp'

export class Contexts extends BaseService {

  auth(req: IAuthContextRequest) {
    return new AuthContext(this.app, req);
  }

  chain(chain: TChains) {
    return chainContextFactory(this.app, chain);
  }

  club(club: Club) {
    return new ClubContext(this.app, club);
  }

  contract(contract: TokenContract) {
    return new ContractContext(this.app, contract);
  }

  contractWallet(contract: TokenContract, wallet: Wallet) {
    return new ContractWalletContext(this.app, contract, wallet);
  }

  clubApp(club: Club, clubApp: ClubApp) {
    return new ClubAppContext(this.app, club, clubApp);
  }

  async clubById(id: string) {
    return this.club(await this.app.m.findOneBy(Club, {id}));
  }

  async clubBySlug(slug: string) {
    return this.club(await this.app.m.findOneBy(Club, {slug}));
  }

  user(user: User) {
    return new UserContext(this.app, user);
  }

  userInClub(user: User, club: Club, opts?: {member?: Member}) {
    return new UserInClubContext(this.app, user, club, opts);
  }

  // async fetchUserInClub(user: User, club: Club, opts?: {member?: Member}) {
  //   return new UserInClubContext(this.app, user, club, opts?: {member?: Member});
  // }

  wallet(wallet: Wallet) {
    return new WalletContext(this.app, wallet);
  }


  // const club = await app.m.findOneByOrFail(Club, {id: opts.clubExt.clubId});
  // const clubApp = await app.m.findOneBy(ClubApp, {id: opts.clubExt.clubId}) || app.m.create(ClubApp, {});
}
