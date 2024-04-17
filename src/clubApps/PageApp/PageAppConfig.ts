import {IAppConfig} from '../../interfaces/IClubApp'

export const PageAppConfig: IAppConfig = {
  key: 'page',
  name: 'page',
  description: 'content page',
  version: '1.0.0',
  coverImg: '/imgs/apps/content-page.jpg',
  tags: '#page #rewards #score #community',
  events: {},
  actions: {},
  config: {
    props: {
      content: {
        key: 'content',
        type: 'string',
        label: 'content',
        editor: {
          type: 'rich-edit'
        },
        description: 'page content',
        default: '',
        required: true,
      }
    },
  },
};
