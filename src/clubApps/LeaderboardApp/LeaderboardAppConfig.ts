import {IAppConfig, IOption} from '../../interfaces/IClubApp'
import {actionTypes, eventNames} from '../../engines/MotionEngine/shared/eventNames'
import ClubBadge, {BadgeType} from '../../models/ClubBadge'
import ClubRole from '../../models/ClubRole'
import {Not} from 'typeorm'
import {nanoid} from 'nanoid'
import Member from '../../models/Member'
import Club from '../../models/Club'
import ClubApp from '../../engines/AppEngine/models/ClubApp'
import {StatusCodes} from 'http-status-codes'
import MemberBadge from '../../models/MemberBadge'
import App from '../../App'


export const listBadges = async ($): Promise<IOption[]> => {
  const badges = await $.m.find(ClubBadge, {
    where: {
      club: {id: $.club.id},
      badgeType: BadgeType.score,
    },
    order: {name: 'ASC'}
  });

  return badges.map((b: ClubBadge) => ({value: b.id, label: b.name, img: b.img}));
}

export const LeaderboardAppConfig: IAppConfig = {
  key: 'leaderboard',
  name: 'leaderboard',
  description: 'visualise your community ratings',
  version: '1.0.0',
  coverImg: '/imgs/apps/leaderboard.png',
  tags: '#page #rewards #score #community',
  events: {},
  actions: {},
  config: {
    props: {
      badgeId: {
        key: 'badgeId',
        type: 'string',
        editor: {
          type: 'select',
          showImage: true,
        },
        label: 'badge',
        description: 'badge to use for ranking — badges of "score" type are listed only',
        values: listBadges,
        required: true,
      }
    },
    // singletone: true,
  },
  // pages: {
  //   root: {
  //     key: 'root',
  //     path: '',
  //     title: 'leaderboard',
  //     data: {
  //
  //     }
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
