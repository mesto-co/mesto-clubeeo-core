import User from '../../models/User'
import Club from '../../models/Club'
import {EntityManager} from 'typeorm'
import {IBricksLogger} from 'bricks-ts-logger'
import UserClubRoleRepo from '../../models/repos/UserClubRoleRepo'

export interface IUserInClubRolesSyncDeps {
  m: EntityManager,
  log: IBricksLogger,
  repos: {
    userClubRole: UserClubRoleRepo,
  }
}

export class UserInClubRolesSync {
  protected app: IUserInClubRolesSyncDeps;
  protected user: User;
  protected club: Club;

  constructor(app: IUserInClubRolesSyncDeps, user: User, club: Club) {
    this.app = app;
    this.user = user;
    this.club = club;
  }

  // todo:
  //  - sync on login
  //  - sync cron
  async roleSync() {
    if (!this.user) return false;
    return false;
  }

}
