import {IAppConfig, IAppMutation$, ICallResult, IOption} from '../../interfaces/IClubApp'
import {actionTypes, eventNames} from '../../engines/MotionEngine/shared/eventNames'
import ClubBadge from '../../models/ClubBadge'
import ClubRole from '../../models/ClubRole'
import {Not} from 'typeorm'
import {MotionActionState} from '../../engines/MotionEngine/models/MotionAction'

export const listBadges = async ($): Promise<IOption[]> => {
  const badges = await $.m.find(ClubBadge, {
    where: {
      club: {id: $.club.id}
    },
    order: {name: 'ASC'}
  });

  return badges.map((b: ClubBadge) => ({value: b.id, label: b.name, img: b.img}));
}

export const listRoles = async ($): Promise<IOption[]> => {
  const roles = await $.m.find(ClubRole, {
    where: {
      club: {id: $.club.id},
      name: Not('admin'),
    },
    order: {name: 'ASC'}
  });

  return roles.map((b: ClubRole) => ({value: b.id, label: b.name}));
}

export const ClubeeoAppConfig: IAppConfig = {
  key: 'clubeeo-app',
  name: 'Clubeeo app',
  description: 'provides core functionality',
  version: '1.0.0',
  coverImg: '/imgs/apps/clubeeo-app.jpg',
  tags: '#automation',
  events: {
    [eventNames.badge.granted]: {
      key: eventNames.badge.granted,
      name: 'badge granted',
      description: 'triggers when badge is granted to member',
      props: {
        badge: {
          key: 'badgeId',
          label: 'badge',
          type: 'string',
          description: 'badge to trigger on',
          editor: {
            type: 'select',
            showImage: true,
          },
          values: listBadges,
        },
      },
      output: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
        'badge.id': {
          key: 'badge.id',
          type: 'number',
          label: 'badge ID',
          description: 'badge identifier',
        },
        'badge.type': {
          key: 'badge.type',
          type: 'string',
          label: 'badge type',
          description: 'badge type: basic or score',
        },
        'badge.img': {
          key: 'badge.img',
          type: 'string',
          label: 'badge image path',
          description: 'path to badge image (without host)',
        },
        'memberBadge.id': {
          key: 'memberBadge.value',
          type: 'number',
          label: 'badge value',
          description: 'badge amount or score (according to badge type)',
        },
        'isCreated': {
          key: 'isCreated',
          type: 'boolean',
          label: 'is created',
          description: 'shows if badge first time assigned to member',
        },
      },
      // guard: ($) => $.trigger.eventProps.badgeId === $.event.data.badge.id,
    },
    [eventNames.role.granted]: {
      key: eventNames.role.granted,
      name: 'role granted',
      description: 'triggers when member role is assigned',
      props: {
        method: {
          key: 'role',
          label: 'role',
          type: 'string',
          description: 'role name',
          editor: {
            type: 'select',
          },
          values: listRoles,
        },
      },
      output: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
        'role.id': {
          key: 'role.id',
          type: 'number',
          label: 'role ID',
          description: 'role identifier',
        },
      }
    },
    [eventNames.role.removed]: {
      key: eventNames.role.removed,
      name: 'role removed',
      description: 'triggers when member role is removed',
      props: {
        method: {
          key: 'role',
          label: 'role',
          type: 'string',
          description: 'role name',
          editor: {
            type: 'select',
          },
          values: listRoles,
        },
      },
      output: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
        'role.id': {
          key: 'role.id',
          type: 'number',
          label: 'role ID',
          description: 'role identifier',
        },
      }
    }
  },
  actions: {
    [actionTypes.badge.grant]: {
      key: actionTypes.badge.grant,
      name: 'grant badge',
      description: 'assign a badge to member',
      props: {
        badge: {
          key: 'badgeId',
          label: 'badge',
          type: 'string',
          description: 'badge to grant',
          editor: {
            type: 'select',
            showImage: true,
          },
          values: listBadges,
        },
        // amount: {
        //   key: 'amount',
        //   label: 'amount',
        //   type: 'string',
        //   description: 'amount to assign (applies to scores)',
        //   default: 1
        // },
      },
      input: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
      },
      call: async ($: IAppMutation$, data): Promise<ICallResult> => {
        const badgeId = $.action?.actionProps?.badgeId || data.badgeId;
        if (!badgeId) return { state: MotionActionState.failed, error: 'no badgeId' };

        // get value from preconfigured props OR from data returned by trigger processor
        const value = $.action?.actionProps?.value || data.value || 1;

        const clubBadge = await $.app.m.findOneBy(ClubBadge, {
          id: badgeId,
          club: {id: $.club.id}
        });
        if (!clubBadge) return { state: MotionActionState.failed, error: 'badge not found' };

        const {memberBadge, isCreated} = await $.app.engines.badgeEngine.grantBadgeToMember(
          {id: $.member.id}, clubBadge, {value}
        );

        return {
          state: MotionActionState.done,
          data: { memberBadge, isCreated }
        };
      }
    },
    [actionTypes.role.grant]: {
      key: actionTypes.role.grant,
      name: 'grant role',
      description: 'assign a role to member',
      props: {
        badge: {
          key: 'roleId',
          label: 'role',
          type: 'string',
          description: 'role to grant',
          editor: {
            type: 'select',
          },
          values: listRoles,
        },
      },
      input: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
      },
      call: async ($: IAppMutation$, data): Promise<ICallResult> => {
        const roleId = $.action?.actionProps?.roleId || data.roleId;
        if (!roleId) return { state: MotionActionState.failed, error: 'no roleId' };

        const clubRole = await $.app.m.findOneBy(ClubRole, {
          id: roleId,
          club: {id: $.club.id}
        });
        if (!clubRole) return { state: MotionActionState.failed, error: 'role not found' };

        const {memberRole, isCreated} = await $.app.engines.roleEngine.grantRole({
          member: $.member,
          clubRole,
        });

        return {
          state: MotionActionState.done,
          data: { memberRole, isCreated }
        };
      },
      //   return {
      //     state: MotionActionState.done,
      //     data: { memberRole, isCreated }
      //   };
      // },
    },
  },
  config: {
    props: {},
    // singletone: true,
  },
  // pages: {
  //   root: {
  //     key: 'root',
  //     path: '',
  //     title: 'webhook',
  //     access: ['admin'],
  //     // view: ($) => ({
  //     //   type: 'table',
  //     //   datasource: `/api/club/${$.club.slug}/app/${$.app.id}`,
  //     // }),
  //   },
  //   logs: {
  //     key: 'logs',
  //     title: 'webhook logs',
  //     access: ['admin'],
  //   }
  // },
  // access: {}
};
