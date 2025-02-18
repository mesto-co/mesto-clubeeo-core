import App from '../../App';
import ClubExtRepo from './ClubExtRepo'
import ClubRepo from './ClubRepo'
import ExtCodeRepo from './ExtCodeRepo'
import UserRepo from './UserRepo'
import UserClubRoleRepo from './UserClubRoleRepo'
import ClubAppRepo from './ClubAppRepo'
import MemberRepo from './MemberRepo'

export class ReposContainer {
  constructor(app: App) {
    this.club = new ClubRepo(app);
    this.clubApp = new ClubAppRepo(app);
    this.clubExt = new ClubExtRepo(app);
    this.extCode = new ExtCodeRepo(app);
    this.member = new MemberRepo(app);
    this.user = new UserRepo(app);
    this.userClubRole = new UserClubRoleRepo(app);
  }

  readonly club: ClubRepo;
  readonly clubApp: ClubAppRepo;
  readonly clubExt: ClubExtRepo;
  readonly extCode: ExtCodeRepo;
  readonly member: MemberRepo;
  readonly userClubRole: UserClubRoleRepo;
  readonly user: UserRepo;
}
