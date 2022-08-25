import App from '../../App';
import {UserExtRepo} from './UserExtRepo';
import WalletNftRepo from './WalletNftRepo'
import ClubRoleTokenRepo from './ClubRoleTokenRepo'
import UserClubRoleRepo from './UserClubRoleRepo'
import {ExtCodeRepo} from './ExtCodeRepo'
import {UserRepo} from '../../services/user/UserRepo'
import ClubRepo from './ClubRepo'
import ClubExtRepo from './ClubExtRepo'

export class ReposContainer {
  constructor(app: App) {
    this.club = new ClubRepo(app);
    this.clubExt = new ClubExtRepo(app);
    this.clubRoleToken = new ClubRoleTokenRepo(app);
    this.userClubRole = new UserClubRoleRepo(app);
    this.user = new UserRepo(app);
    this.userExt = new UserExtRepo(app);
    this.extCode = new ExtCodeRepo(app);
    this.walletNft = new WalletNftRepo(app);
  }

  readonly club: ClubRepo;
  readonly clubExt: ClubExtRepo;
  readonly clubRoleToken: ClubRoleTokenRepo;
  readonly userClubRole: UserClubRoleRepo;
  readonly user: UserRepo;
  readonly userExt: UserExtRepo;
  readonly extCode: ExtCodeRepo;
  readonly walletNft: WalletNftRepo;
}
