import {IAppConfig} from '../../interfaces/IClubApp'

export const profileEventNames = {
  profile: {
    updated: 'profile:updated',
  }
}

export const ClubeeoAppConfig: IAppConfig = {
  key: 'mesto-profile-app',
  name: 'Mesto Profile app',
  description: 'enable profile management',
  version: '1.0.0',
  coverImg: '/imgs/apps/clubeeo-app.jpg',
  tags: '#profile #mesto',
  events: {
    [profileEventNames.profile.updated]: {
      key: profileEventNames.profile.updated,
      name: 'profile created',
      description: 'triggers when member profile is created',
      props: {},
      output: {
        'member.id': {
          key: 'member.id',
          type: 'number',
          label: 'member ID',
          description: 'community member identifier',
        },
        'isCreated': {
          key: 'isCreated',
          type: 'boolean',
          label: 'is created',
          description: 'shows if profile is created',
        },
      },
    },
  },
  actions: {},
  config: {
    props: {},
  },
};
