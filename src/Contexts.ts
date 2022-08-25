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
import ClubApp from './models/ClubApp'
import {ClubAppContext} from './contexts/ClubAppContext'
import ClubExt from './models/ClubExt'
import {DiscordClubUserContext, discordClubUserContextFactory} from './clubApps/DiscordApp/DiscordClubUserContext'
import {DiscordClubAppContext} from './clubApps/DiscordApp/DiscordClubAppContext'

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

  async clubById(id: number) {
    return this.club(await this.app.m.findOneBy(Club, {id}));
  }

  async clubBySlug(slug: string) {
    return this.club(await this.app.m.findOneBy(Club, {slug}));
  }

  discordClubApp(club: Club, clubApp: ClubApp, clubExt: ClubExt) {
    return new DiscordClubAppContext(this.app, this.clubApp(club, clubApp), clubExt);
  }

  async discordClubUser(discordUserId: string, discordClubId: string): Promise<DiscordClubUserContext> {
    return await discordClubUserContextFactory(this.app, discordUserId, discordClubId);
  }

  user(user: User) {
    return new UserContext(this.app, user);
  }

  userInClub(user: User, club: Club) {
    return new UserInClubContext(this.app, user, club);
  }

  async fetchUserInClub(user: User, club: Club) {
    return new UserInClubContext(this.app, user, club);
  }

  wallet(wallet: Wallet) {
    return new WalletContext(this.app, wallet);
  }


  // async discordClubAppByExt(club: Club, clubApp: ClubApp, clubExt: ClubExt) {
  //
  // }

  // const club = await app.m.findOneByOrFail(Club, {id: opts.clubExt.clubId});
  // const clubApp = await app.m.findOneBy(ClubApp, {id: opts.clubExt.clubId}) || app.m.create(ClubApp, {});
  // new DiscordAppContext(app, new ClubAppContext(app, club, clubApp), opts.clubExt);
}
