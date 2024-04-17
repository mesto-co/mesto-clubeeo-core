import App from '../App';
import {simplePaginator} from '../lib/crudHelpers';
import {ReasonPhrases, StatusCodes} from 'http-status-codes';
import {arr, enumStr, id, int, obj, str} from 'json-schema-blocks';
import Post, {IPostEdit} from '../models/Post';
import Club from '../models/Club'
import PostReaction, {PostReactionTypes} from '../models/PostReaction'
import User from '../models/User'
import PostComment from '../models/PostComment'
import {sanitizeHtmlDefault} from '../lib/sanitize'
import ClubApp from '../engines/AppEngine/models/ClubApp'

// fields presented in all requests & responses
export const postBaseSchema = {
  text: str(),
  // clubId: str(1),
  // authorId: nullable(id()),
}

// modifiable fields (create & update)
export const postModifySchema = {
  text: str(),
  clubId: str(1),
  clubAppId: str(1),
}

// response schema
export const postViewSchema = {
  id: str(1),
  ...postBaseSchema,
  createdAt: str(),
  updatedAt: str(),
}

export const postSerializedSchema = {
  ...postViewSchema,
  author: obj({
    screenName: str(),
    imgUrl: str(),
  }),
  reactions: obj({}, {additionalProperties: true}),
  myReactions: obj({}, {additionalProperties: true}),
  comments: arr(
    obj({
      id: str(1),
      text: str(),
      user: {
        screenName: str(),
        imgUrl: str(),
      },
      createdAt: str(),
      updatedAt: str(),
    })
  )
}

export const postResponseSchema = {
  post: obj(postSerializedSchema),
}

const clubPostSerializer = async (app: App, user: User, post: Post, opts?: {loadComments: boolean}) => {
  const rawReactions: {count: string, reaction: string}[] = await app.m.createQueryBuilder(PostReaction, 'pr')
    .select("COUNT(pr.reaction) AS count, pr.reaction")
    .where("pr.postId = :postId", { postId: post.id })
    .groupBy('pr.reaction')
    .getRawMany();

  const reactions = Object.fromEntries(rawReactions.map(r => [r.reaction, Number(r.count)])) || {};

  const rawMyReactions: {count: string, reaction: string}[] = user ? await app.m.createQueryBuilder(PostReaction, 'pr')
    .select("COUNT(pr.reaction) AS count, pr.reaction")
    .where("pr.postId = :postId AND pr.userId = :userId", { postId: post.id, userId: user.id })
    .groupBy('pr.reaction')
    .getRawMany() : [];

  const myReactions = Object.fromEntries(rawMyReactions.map(r => [r.reaction, Number(r.count)])) || {};

  const comments = opts?.loadComments ? await app.m.find(PostComment, {
    where: { post: {id: post.id} },
    relations: ['user'],
    order: { createdAt: 'DESC' }
  }) : [];

  return {
    reactions,
    myReactions,
    comments,
    ...post,
  }
}

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/', {
      schema: {
        description: 'List Posts',
        query: obj({
          clubId: str(1),
          clubAppId: str(1),
          page: id(),
          take: int(1, 1000),
        }, {
          optional: ['page', 'take'],
        }),
        response: {
          200: obj({
            posts: arr(
              obj(postSerializedSchema),
            ),
            pagination: obj({
              page: id(),
              take: int(1, 1000),
              skip: id(),
            }),
          }),
        },
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req);
      const clubId = req.query.clubId;
      const clubAppId = req.query.clubAppId;

      const club = await app.m.findOneOrFail(Club, {
        where: {id: clubId}
      });
      const clubApp = await app.m.findOneOrFail(ClubApp, {where: {id: clubAppId}});
      if (clubApp.config['publicView']) {
        // todo: make configurable to public via club roles | access engine
      } else {
        if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});

        const userInClub = app.contexts.userInClub(user, club);
        if (!await userInClub.isMember({useCache: true})) {
          resp.code(StatusCodes.FORBIDDEN).send({ isMember: false, hasAccess: false, data: null });
          return;
        }

        if (!await app.engines.accessEngine.userHasAccessToApp(user, clubApp)) {
          resp.code(StatusCodes.FORBIDDEN).send({ isMember: false, hasAccess: false, data: null, error: 'Access denied' });
          return;
        }
      }

      const pagination = simplePaginator(req.query);

      const posts = await app.m.find(Post, {
        where: {
          club: {id: clubId},
          clubApp: {id: clubAppId}
        },
        order: {id: 'DESC'},
        relations: ['author'],
        take: pagination.take,
        skip: pagination.skip,
      });

      const postsResult = [];
      for (const post of posts) {
        postsResult.push(await clubPostSerializer(app, user, post, {loadComments: true}));
      }

      resp.send({
        posts: postsResult,
        pagination,
      });
    });

    // router.get('/:postId', {
    //   schema: {
    //     description: 'Show post',
    //     response: {
    //       200: obj(postResponseSchema)
    //     }
    //   },
    // }, async (req, resp) => {
    //   const postId = req.params.postId;
    //
    //   const post = await app.m.findOne(Post, {id: postId});
    //
    //   if (post) {
    //     resp.send({
    //       post
    //     });
    //   } else {
    //     resp.code(StatusCodes.NOT_FOUND).send({
    //       error: 'Post is not found'
    //     });
    //   }
    // });

    router.post('/', {
      schema: {
        description: 'Create post',
        body: obj({
          post: obj(postModifySchema),
        }),
        response: {
          200: obj(postResponseSchema),
        },
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req)
      if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});

      const postData = req.body.post as IPostEdit;

      const club = await app.m.findOneOrFail(Club, {where: {id: postData.clubId}});
      const clubApp = await app.m.findOneOrFail(ClubApp, {where: {id: postData.clubAppId}});

      const userInClub = app.contexts.userInClub(user, club);
      if (!await userInClub.isMember({useCache: true})) {
        resp.code(StatusCodes.FORBIDDEN).send({ isMember: false, hasAccess: false, data: null });
        return;
      }

      if (!await app.engines.accessEngine.userHasAccessToApp(user, clubApp)) {
        resp.code(StatusCodes.FORBIDDEN).send({ isMember: false, hasAccess: false, data: null, error: 'Access denied' });
        return;
      }

      app.modelHooks.beforeCreate('post', postData);

      const sanitizedText = sanitizeHtmlDefault(postData.text);

      await app.access.require('create', 'post', user, postData);
      const post = app.m.create(Post, {
        ...postData,
        text: sanitizedText,
        club,
        clubApp,
        author: user,
      });
      await app.m.save(post);

      app.modelHooks.afterCreate('post', post);

      const postResult = await clubPostSerializer(app, user, post, {loadComments: true})

      resp.send({
        post: postResult,
      });
    });

    // router.put('/:postId', {
    //   schema: {
    //     description: 'Update post',
    //     body: obj({
    //       post: obj(postModifySchema)
    //     }),
    //     response: {
    //       200: obj(postResponseSchema)
    //     }
    //   },
    // }, async (req, resp) => {
    //   const postId = req.params.postId;
    //
    //   const user = await app.auth.getUser(req.session)
    //   if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});
    //
    //   const post = await app.m.findOne(Post, {id: postId});
    //
    //   if (!post) {
    //     return resp.code(StatusCodes.NOT_FOUND).send({
    //       error: 'Post is not found'
    //     });
    //   }
    //
    //   const postData = req.body.post;
    //
    //   const prevData = {...post};
    //   app.modelHooks.beforeUpdate('post', {...postData, id: postId}, prevData);
    //
    //   Object.assign(post, postData);
    //
    //   await app.m.save(post);
    //
    //   app.modelHooks.afterUpdate('post', post, prevData);
    //
    //   resp.send({
    //     post
    //   });
    // });

    router.post('/reaction', {
      schema: {
        description: 'Reaction to post',
        body: obj({
          postReaction: obj({
            postId: str(1),
            reaction: enumStr(...Object.keys(PostReactionTypes)),
          }),
        }),
        //todo: failure resoponse
        response: {
          200: obj(postResponseSchema),
        },
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req)
      if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});

      const data = req.body.postReaction as {
        postId: string,
        reaction: PostReactionTypes,
      };

      app.modelHooks.beforeCreate('post', data);

      const post = await app.m.findOneOrFail(Post, {
        where: { id: data.postId },
        relations: ['club', 'author', 'clubApp'],
      });

      const club = post.club;
      const clubApp = post.clubApp;

      const autoRoleOnReaction = clubApp.config['autoRoleOnReaction'];
      if (autoRoleOnReaction) {
        await app.engines.roleEngine.grantRoleToUserBySlug(user, club, autoRoleOnReaction, {createIfNotExists: true});
      }

      const userInClub = app.contexts.userInClub(user, club);
      if (!await userInClub.isMember({useCache: true})) {
        resp.send({ isMember: false, hasAccess: false, data: null });
        return;
      }

      // await app.access.require('create', 'post', user, postData);
      let postReaction = await app.m.findOneBy(PostReaction, {
        user: {id: user.id},
        post: {id: post.id},
        club: {id: post.club.id},
        clubApp: {id: post.clubApp.id},
      });

      if (!postReaction) {
        postReaction = app.m.create(PostReaction, {
          user,
          post,
          club: post.club,
          clubApp: {id: post.clubApp.id},
        });
      }

      postReaction.reaction = data.reaction;
      await app.m.save(postReaction);

      app.postEvents.emit('reaction', {
        club: post.club,
        clubApp: post.clubApp,
        post,
        reaction: postReaction,
        user,
      });

      const postResult = await clubPostSerializer(app, user, post, {loadComments: true});

      resp.send({
        post: postResult,
      });
    });

    router.post('/comment', {
      schema: {
        description: 'Post comment',
        body: obj({
          comment: obj({
            postId: str(1),
            text: str(),
          }),
        }),
        response: {
          200: obj(postResponseSchema),
        },
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req)
      if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});

      const data = req.body.comment as {
        postId: string,
        clubAppId: string,
        text: string,
      };

      app.modelHooks.beforeCreate('postComment', data);

      const post = await app.m.findOneOrFail(Post, {
        where: { id: data.postId },
        relations: ['club', 'clubApp', 'author'],
      });

      const club = post.club;
      const userInClub = app.contexts.userInClub(user, club);
      if (!await userInClub.isMember({useCache: true})) {
        resp.send({ isMember: false, hasAccess: false, data: null });
        return;
      }

      // comment created flag
      let created = false;
      let postComment = await app.m.findOneBy(PostComment, {
        user: {id: user.id},
        post: {id: post.id},
        club: {id: post.club.id},
        clubApp: {id: post.clubApp.id},
        text: data.text,
      });

      if (!postComment) {
        // await app.access.require('create', 'post', user, postData);
        const postComment = app.m.create(PostComment, {
          user,
          post,
          club: post.club,
          clubApp: post.clubApp,
          text: data.text,
        });
        await app.m.save(postComment);
        created = true;
      }

      app.modelHooks.afterCreate('post', post);

      const postResult = await clubPostSerializer(app, user, post, {loadComments: true});

      resp.send({
        post: postResult,
        created,
      });
    });

    next();
  }

  // todo: DELETE
}
