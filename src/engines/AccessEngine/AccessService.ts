import { In } from 'typeorm';
import { MemberContext } from "./AccessMemberContext";
import { TExeContainer } from "../../core/exeInterfaces";
import ClubRole from "../../models/ClubRole";
import MemberRole from "../../models/MemberRole";
import { ExePureCore } from "../../lib/ExePureCore";
import { AccessEngineTypes as types } from './AccessEngineTypes';

/**
 * AccessService - contains the business logic for the AccessService.
 */
export class AccessService<T extends TExeContainer> implements ExePureCore.IAccessService {
  constructor(public c: T) {
  }

  memberCtx(member: types.IMember, user: types.IUser, club: types.IClub) {
    return new MemberContext(this, member, user, club);
  }

  async can({member, hub}: ExePureCore.TMemberCtx, action: string, resource: string): Promise<boolean> {
    return false; // don't let anything by default
  }

  async hasRole({member, user, hub}: ExePureCore.TMemberCtx, roleSlug: string): Promise<boolean> {
    const memberRole = await this.c.m.findOneBy('MemberRole', {
      member: {id: member.id},
      user: {id: user.id},
      club: {id: hub.id},
      clubRole: {
        club: {id: hub.id},
        name: roleSlug,
      },
      enabled: true,
    });

    return !!memberRole;
  }

  /**
   * @deprecated Use hasRole instead
   */
  async memberHasRole(member: types.IMember, user: types.IUser, club: types.IClub, roleSlug: string) {
    if (!member || !user || !club) return false;
    return this.hasRole({member, user, hub: club}, roleSlug);
  }

  async getRolesMap<T extends string>({member, user, hub}: ExePureCore.TMemberCtx, roleSlugs: T[]): Promise<Record<T, boolean>> {
    if (!member || !user || !hub) roleSlugs.reduce((acc, roleSlug) => {
      acc[roleSlug] = false;
      return acc;
    }, {} as Record<T, boolean>);

    const memberRoles = await this.c.m.find(MemberRole, {
      where: {
        member: {id: member.id},
        club: {id: hub.id},
        clubRole: {
          club: {id: hub.id},
          name: In(roleSlugs),
        },
        enabled: true,
      },
      relations: ['clubRole'],
    });

    return roleSlugs.reduce((acc, roleSlug) => {
      acc[roleSlug] = !!memberRoles.find(mr => mr.clubRole?.name === roleSlug);
      return acc;
    }, {} as Record<T, boolean>);
  } 

  async addRole({member, user, hub}: ExePureCore.TMemberCtx, roleSlug: string): Promise<boolean> {
    const clubRole = await this.c.m.findOneBy(ClubRole, {
      club: {id: hub.id},
      name: roleSlug,
    });

    if (!clubRole) return false;

    await this.c.em.createOrUpdateBy(MemberRole, {
      member: {id: member.id},
      user: {id: user.id},
      club: {id: hub.id},
      clubRole: {id: clubRole.id},
    }, {
      enabled: true,
    });

    return true;
  }

  /**
   * @deprecated Use addRole instead
   */
  async addMemberRole(member: types.IMember, user: types.IUser, club: types.IClub, roleSlug: string) {
    if (!member || !user || !club) return false;
    return this.addRole({member, user, hub: club}, roleSlug);
  }

  async removeRole({member, user, hub}: ExePureCore.TMemberCtx, roleSlug: string): Promise<boolean> {
    const clubRole = await this.c.m.findOneBy(ClubRole, {
      club: {id: hub.id},
      name: roleSlug,
    });

    if (!clubRole) return false;

    await this.c.em.updateIfExistBy(MemberRole, {
      member: {id: member.id},
      user: {id: user.id},
      club: {id: hub.id},
      clubRole: {id: clubRole.id},
    }, {
      enabled: false,
    });

    return true;
  }

  /**
   * @deprecated Use removeRole instead
   */
  async removeMemberRole(member: types.IMember, user: types.IUser, club: types.IClub, roleSlug: string) {
    if (!member || !user || !club) return false;
    return this.removeRole({member, user, hub: club}, roleSlug);
  }

}