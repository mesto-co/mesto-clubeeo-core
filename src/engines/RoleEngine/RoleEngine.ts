import { MestoApp as App } from '../../App'
import User from '../../models/User'
import Club from '../../models/Club'
import ClubRole from '../../models/ClubRole'
import MemberRole from '../../models/MemberRole'
import Member from '../../models/Member'
import {IEntityId} from '../../lib/common'
import assert from 'assert'
import {Emitter} from 'mitt'
import {RoleEngineEvents, roleEngineEventsFactory} from './RoleEngineEvents'
import { EngineBase } from '../../core/lib/EngineBase'

export class RoleEngine extends EngineBase {
  readonly app: App;
  readonly events: Emitter<RoleEngineEvents>;

  constructor(app: App) {
    super();

    this.app = app;
    this.events = roleEngineEventsFactory(app);
  }

  async findRoleBySlug(club: Club, roleSlug: string) {
    return await this.app.m.findOneBy(ClubRole, {
      club: {id: club.id},
      name: roleSlug
    });
  }

  async grantRole(opts: {member: Member | IEntityId, clubRole: ClubRole}) {
    const member = await this.app.repos.member.getOrLoad(opts.member);
    assert(member.clubId === opts.clubRole.clubId, `can't grant role to a member of another club`);

    const {value: memberRole, isCreated} = await this.app.em.findOneOrCreateBy(MemberRole, {
      member: {id: member.id},
      user: {id: member.userId},
      club: {id: opts.clubRole.clubId},
      clubRole: {id: opts.clubRole.id},
    }, {
      enabled: true,
    });

    let emitCreatedEvent = isCreated;
    if (!isCreated && !memberRole.enabled) {
      memberRole.enabled = true;
      await this.app.m.save(memberRole);
      emitCreatedEvent = true;
    }

    if (emitCreatedEvent) {
      this.events.emit('roleGranted', {
        user: {id: member.userId},
        club: opts.clubRole.club || {id: opts.clubRole.clubId},
        clubRole: opts.clubRole,
        member,
        memberRole,
        isCreated,
      });
    }

    return {
      memberRole,
      isCreated,
    };
  }

  async grantRoleBySlug(opts: {member: Member | IEntityId, club: Club, roleSlug: string, createIfNotExists?: boolean}) {
    let clubRole = await this.findRoleBySlug(opts.club, opts.roleSlug);
    if (!clubRole) {
      if (opts.createIfNotExists) {
        const result = await this.createRoleIfNotExists(opts.club, opts.roleSlug);
        clubRole = result.value;
      } else {
        return null;
      }
    }
    return await this.grantRole({member: opts.member, clubRole});
  }

  async removeRole(opts: {member: Member | IEntityId, clubRole: ClubRole}) {
    const member = await this.app.repos.member.getOrLoad(opts.member);
    assert(member.clubId === opts.clubRole.clubId, `can't remove role from a member of another club`);

    const memberRole = await this.app.m.findOneBy(MemberRole, {
      member: {id: member.id},
      club: {id: opts.clubRole.clubId},
      clubRole: {id: opts.clubRole.id},
    });
    if (memberRole?.enabled) {
      memberRole.enabled = false;
      await this.app.m.save(memberRole);

      this.events.emit('roleRemoved', {
        user: {id: member.userId},
        club: opts.clubRole.club || {id: opts.clubRole.clubId},
        clubRole: opts.clubRole,
        member,
        memberRole,
      });
    }

    return {
      memberRole,
    };
  }

  /**
   * @deprecated use grantBadgeToMember instead
   */
  async grantRoleToUser(user: User, role: ClubRole) {
    return await this.app.em.createOrUpdateBy(MemberRole, {
      user: {id: user.id},
      club: {id: role.clubId},
      clubRole: {id: role.id},
    }, {
      enabled: true,
    });
  }

  /**
   * @deprecated use grantBadgeToMember instead
   */
  async grantRoleToUserBySlug(user: User, club: Club, roleSlug: string, opts: {createIfNotExists?: boolean} = {}) {
    let clubRole = await this.findRoleBySlug(club, roleSlug);
    if (!clubRole) {
      if (opts.createIfNotExists) {
        const result = await this.createRoleIfNotExists(club, roleSlug);
        clubRole = result.value;
      } else {
        return null;
      }
    }
    return await this.grantRoleToUser(user, clubRole);
  }

  async createRoleIfNotExists(club: Club, name: string) {
    return await this.app.em.findOneOrCreateBy(ClubRole, {
      club: {id: club.id},
      name,
    }, {});
  }
}
