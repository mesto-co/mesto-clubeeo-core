import {nanoid} from 'nanoid'
import {IAppConfig} from '../../interfaces/IClubApp'

export const WebhookEndpointConfig: IAppConfig = {
  key: 'webhook-endpoint',
  name: 'webhook endpoint',
  description: 'handles external requests',
  version: '1.0.0',
  coverImg: '/imgs/apps/webhook.png',
  tags: '#automation',
  events: {
    'webhook:request': {
      key: 'webhook:request',
      name: 'request',
      description: "triggers when http request to webhook url is performed.<br />memberId should be provided via URL parameter or in POST body",
      props: {
        method: {
          key: 'method',
          label: 'method',
          type: 'string',
          editor: {
            type: 'select'
          },
          values: [{value: 'get', label: 'get'}, {value: 'post', label: 'post'}],
          description: 'webhook http method',
        },
      },
      output: {
        query: {
          key: 'query',
          type: 'object',
          label: 'query',
          description: 'query params',
        },
        data: {
          key: 'data',
          type: 'object',
          label: 'data',
          description: 'post data',
        },
      },
      guard: ($) => $.trigger.eventProps.method === $.event.data.method,
    }
  },
  actions: {},
  config: {
    props: {
      url: {
        key: 'url',
        type: 'string',
        label: 'webhook url',
        description: '',
        default: ($) => $.clubApp ? nanoid() : 'generated upon installation',
        view: ($, v) => `https://clubeeo.com/m/${v.value}`,
        editor: {
          type: 'copy'
        },
        editable: false,
        required: true,
      }
    },
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
