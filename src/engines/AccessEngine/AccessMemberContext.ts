import { AccessService } from './AccessService';
import { TExeContainer } from '../../core/exeInterfaces';
import { ExePureCore } from '../../lib/ExePureCore';
import { AccessEngineTypes as types } from './AccessEngineTypes';

export class MemberContext<
  T extends TExeContainer,
  TMember extends types.IMember,
  TUser extends types.IUser,
  TClub extends types.IClub
> implements ExePureCore.IMemberContext<TMember, TUser, TClub> {
  constructor(public service: AccessService<T>, public member: TMember, public user: TUser, public club: TClub) {

    if (!member?.id) throw new Error('Member has no id');
    if (!club?.id) throw new Error('Club has no id');
    if (!user?.id) throw new Error('User has no id')
    if (!member?.clubId) throw new Error('Member has no clubId');
    if (member.clubId !== club.id) throw Error('Member does not belong to the club');
    if (member.userId !== user.id) throw Error('Member does not belong to the club');
  }

  hubEntityName = 'Club';
  memberEntityName = 'Member';
  userEntityName = 'User';

  get clubId() {
    return this.club.id;
  }

  get memberId() {
    return this.member.id;
  }

  get userId() {
    return this.user.id;
  }

  get hubId() {
    return this.club.id;
  }

  get hub() {
    return this.club;
  }

  get name(): string {
    if ('displayName' in this.member) {
      return String(this.member)
    } else if ('displayName' in this.user) {
      return String(this.user)
    } else if ('name' in this.member) {
      return String(this.name)
    } else if ('name' in this.user) {
      return String(this.user)
    } else {
      return `#${this.member.id}`;
    }
  }

  async hasRole(
    roleSlug: string,
  ) {
    return await this.service.hasRole(this, roleSlug);
  }

  async getRolesMap<T extends string>(roleSlugs: T[]) {
    return await this.service.getRolesMap<T>(this, roleSlugs);
  }

  async addRole(roleSlug: string) {
    return await this.service.addRole(this, roleSlug);
  }

  async removeRole(roleSlug: string) {
    return await this.service.removeRole(this, roleSlug);
  }
}