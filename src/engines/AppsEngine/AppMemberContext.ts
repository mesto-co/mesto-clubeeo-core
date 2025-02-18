import { AppsService } from './AppsService';
import { TExeContainer } from '../../core/exeInterfaces';

interface IMember {
  id: string,
  clubId: string,
}

interface IClubApp {
  id: string,
  clubId: string,
}

export class AppMemberContext<T extends TExeContainer, TMember extends IMember, TClubApp extends IClubApp> {
  constructor(public service: AppsService<T>, public member: TMember, public clubApp: TClubApp) {

    if (!member?.clubId) throw new Error('Member has no clubId');
    if (!clubApp?.clubId) throw new Error('ClubApp has no clubId');
    if (member.clubId !== clubApp.clubId) throw Error('Member and ClubApp are from different clubs');
  }

  get clubId() {
    return this.member.clubId;
  }

  get memberId() {
    return this.member.id;
  }

  get appId() {
    return this.clubApp.id;
  }

  async canOpen(
    page: string = '',
  ) {
    const accessTo = `page:${page}`;
    return await this.service.can(this.member, this.clubApp, accessTo);
  }

  async canDo(
    action: string,
  ) {
    const accessTo = `action:${action}`;
    return await this.service.can(this.member, this.clubApp, accessTo);
  }
}