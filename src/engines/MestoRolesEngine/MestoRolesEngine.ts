import { MestoApp as App } from '@/App';
import { EngineBase } from '@/core/lib/EngineBase';
import { Member } from '@/models/Member';
import { IEntityId } from '@/lib/common';

interface RoleUpdateRequest {
  member: Member | IEntityId;
  rolesToAdd: string[];
  rolesToRemove: string[];
}

interface RoleRule {
  remove?: string[];
  require?: string[];
}

export class MestoRolesEngine extends EngineBase {
  private readonly roleRules: Record<string, RoleRule> = {
    guest: { remove: ['member', 'rejected'] },
    member: { remove: ['guest', 'rejected'] },
    rejected: { remove: ['guest', 'member'] },
    researcher: { require: ['member'] },
    master: { require: ['member'] },
    legend: { require: ['member'] },
  };

  constructor(readonly app: App) {
    super();
  }

  /**
   * Updates multiple roles for a member, handling role dependencies and requirements
   * @throws Error if there are conflicts between roles or missing required roles
   */
  async updateRoles(request: RoleUpdateRequest): Promise<void> {
    const member = await this.app.repos.member.getOrLoad(request.member);

    // Build complete lists of roles to add and remove
    const { rolesToAdd, rolesToRemove, requiredRoles } = this.buildRoleLists(request.rolesToAdd, request.rolesToRemove);

    // Validate role compatibility
    this.validateRoleCompatibility(rolesToAdd, rolesToRemove, requiredRoles);

    // Check if required roles are already assigned
    await this.validateRequiredRoles(member, requiredRoles, rolesToAdd);

    // Process role removals first
    for (const roleSlug of rolesToRemove) {
      const clubRole = await this.app.engines.role.findRoleBySlug(member.club, roleSlug);
      if (clubRole) {
        await this.app.engines.role.removeRole({ member, clubRole });
      }
    }

    // Process role additions
    for (const roleSlug of rolesToAdd) {
      const clubRole = await this.app.engines.role.findRoleBySlug(member.club, roleSlug);
      if (clubRole) {
        await this.app.engines.role.grantRole({ member, clubRole });
      }
    }
  }

  private buildRoleLists(rolesToAdd: string[], rolesToRemove: string[]): {
    rolesToAdd: string[];
    rolesToRemove: string[];
    requiredRoles: string[];
  } {
    const finalRolesToAdd = new Set(rolesToAdd);
    const finalRolesToRemove = new Set(rolesToRemove);
    const requiredRoles = new Set<string>();

    // Process roles to add
    for (const role of rolesToAdd) {
      const rule = this.roleRules[role];
      if (rule) {
        // Add roles that should be removed
        if (rule.remove) {
          rule.remove.forEach(r => finalRolesToRemove.add(r));
        }
        // Add required roles
        if (rule.require) {
          rule.require.forEach(r => requiredRoles.add(r));
        }
      }
    }

    // Process roles to remove
    for (const role of rolesToRemove) {
      const rule = this.roleRules[role];
      if (rule) {
        // Add roles that should be removed
        if (rule.remove) {
          rule.remove.forEach(r => finalRolesToRemove.add(r));
        }
      }
    }

    return {
      rolesToAdd: Array.from(finalRolesToAdd),
      rolesToRemove: Array.from(finalRolesToRemove),
      requiredRoles: Array.from(requiredRoles)
    };
  }

  private validateRoleCompatibility(
    rolesToAdd: string[],
    rolesToRemove: string[],
    requiredRoles: string[]
  ): void {
    const conflicts: string[][] = [];

    // Check for conflicts between roles to add and remove
    for (const roleToAdd of rolesToAdd) {
      if (rolesToRemove.includes(roleToAdd)) {
        conflicts.push([roleToAdd, 'conflicts with removal']);
      }
    }

    // Check for conflicts between required roles and roles to remove
    for (const requiredRole of requiredRoles) {
      if (rolesToRemove.includes(requiredRole)) {
        conflicts.push([requiredRole, 'is required but marked for removal']);
      }
    }

    if (conflicts.length > 0) {
      throw new Error(
        `Role conflicts found: ${conflicts
          .map(([role, reason]) => `"${role}" ${reason}`)
          .join(', ')}`
      );
    }
  }

  private async validateRequiredRoles(
    member: Member,
    requiredRoles: string[],
    rolesToAdd: string[]
  ): Promise<void> {
    const missingRequiredRoles: string[] = [];

    for (const requiredRole of requiredRoles) {
      // Skip if the required role is already in the add list
      if (rolesToAdd.includes(requiredRole)) {
        continue;
      }

      // Check if the member already has the required role
      const clubRole = await this.app.engines.role.findRoleBySlug(member.club, requiredRole);
      if (clubRole) {
        const memberRole = await this.app.m.findOneBy('MemberRole', {
          member: { id: member.id },
          clubRole: { id: clubRole.id },
          enabled: true
        });

        if (!memberRole) {
          missingRequiredRoles.push(requiredRole);
        }
      } else {
        missingRequiredRoles.push(requiredRole);
      }
    }

    if (missingRequiredRoles.length > 0) {
      throw new Error(
        `Missing required roles: ${missingRequiredRoles.join(', ')}`
      );
    }
  }
}