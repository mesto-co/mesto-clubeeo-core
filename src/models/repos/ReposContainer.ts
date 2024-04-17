import App from '../../App';
import ClubExtRepo from './ClubExtRepo'
import ClubRepo from './ClubRepo'
import ClubRoleTokenRepo from './ClubRoleTokenRepo'
import ExtCodeRepo from './ExtCodeRepo'
import UserRepo from './UserRepo'
import UserClubRoleRepo from './UserClubRoleRepo'
import UserExtRepo from './UserExtRepo';
import WalletNftRepo from './WalletNftRepo'
import ClubAppRepo from './ClubAppRepo'
import MemberRepo from './MemberRepo'

export class ReposContainer {
  constructor(app: App) {
    this.club = new ClubRepo(app);
    this.clubApp = new ClubAppRepo(app);
    this.clubExt = new ClubExtRepo(app);
    this.clubRoleToken = new ClubRoleTokenRepo(app);
    this.extCode = new ExtCodeRepo(app);
    this.member = new MemberRepo(app);
    this.user = new UserRepo(app);
    this.userClubRole = new UserClubRoleRepo(app);
    this.userExt = new UserExtRepo(app);
    this.walletNft = new WalletNftRepo(app);
  }

  readonly club: ClubRepo;
  readonly clubApp: ClubAppRepo;
  readonly clubExt: ClubExtRepo;
  readonly clubRoleToken: ClubRoleTokenRepo;
  readonly extCode: ExtCodeRepo;
  readonly member: MemberRepo;
  readonly userClubRole: UserClubRoleRepo;
  readonly user: UserRepo;
  readonly userExt: UserExtRepo;
  readonly walletNft: WalletNftRepo;
}
