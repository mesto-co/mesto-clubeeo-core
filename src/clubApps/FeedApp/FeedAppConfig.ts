import {IAppConfig, IAppMutation$, ICallResult} from '../../interfaces/IClubApp'
import Post from '../../models/Post'
import {sanitizeHtmlDefault} from '../../lib/sanitize'
import {MotionActionState} from '../../engines/MotionEngine/models/MotionAction'

export const feedAppEvents = {
  postCreated: 'postCreated',
}

const createPost = async ($: IAppMutation$, data): Promise<ICallResult> => {
  const sanitizedText = sanitizeHtmlDefault(data.text);

  const post = $.app.m.create(Post, {
    text: sanitizedText,
    club: $.club,
    clubApp: $.clubApp,
    author: $.member,
  });
  await $.app.m.save(post);

  void $.emit(feedAppEvents.postCreated, { post, text: post.text });

  return {
    state: MotionActionState.done,
    data: post,
  }
}

export const FeedAppConfig: IAppConfig = {
  key: 'feed',
  name: 'feed',
  description: 'community feed',
  version: '1.0.0',
  coverImg: '/imgs/apps/post.png',
  tags: '#posts #community',
  events: {
    [feedAppEvents.postCreated]: {
      key: feedAppEvents.postCreated,
      name: 'post created',
      description: 'triggers when new post is created',
      props: {},
      output: {
        text: {
          key: 'text',
          type: 'string',
          label: 'post text',
          description: 'post text',
        },
        post: {
          key: 'post',
          type: 'object',
          label: 'post',
          description: 'post data: post.id, post.text',
        }
      }
    }
  },
  actions: {
    postCreate: {
      key: 'postCreate',
      name: 'create post',
      description: 'create new post in feed',
      props: {},
      input: {
        text: {
          key: 'text',
          type: 'string',
          label: 'text',
          description: 'post text',
        }
      },
      call: createPost,
    }
  },
  config: {
    props: {},
  },
  pages: {
    '': {
      name: 'feed',
      data: async ($) => {
        const posts = await $.app.m.find(Post, {
          where: {
            club: {id: $.club.id},
            clubApp: {id: $.clubApp.id},
          },
          relations: {
            author: true
          },
          order: {id: 'DESC'},
          take: 100,
        });

        return {
          posts,
        }
      }
    },
  },
};
