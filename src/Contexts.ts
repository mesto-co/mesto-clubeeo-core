import {BaseService} from './services/BaseService'
import {AuthContext, IAuthContextRequest} from './contexts/AuthContext'
import Club from './models/Club'
import {ClubContext} from './contexts/ClubContext'
import User from './models/User'
import {UserContext} from './contexts/UserContext'
import UserInClubContext from './contexts/UserInClubContext'
import {ClubAppContext} from './contexts/ClubAppContext'
import Member from './models/Member'
import ClubApp from './engines/AppsEngine/models/ClubApp'

export class Contexts extends BaseService {

  auth(req: IAuthContextRequest) {
    return new AuthContext(this.app, req);
  }

  club(club: Club) {
    return new ClubContext(this.app, club);
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
}
