import Club from './models/Club';
import Member from './models/Member';
import {graphqlResolvers} from './graphql/graphqlResolvers';
import {graphqlSchema} from './graphql/graphqlSchema';
import {MestoApp} from './App';
import { ApolloServer } from '@apollo/server';
import { fastifyApolloHandler } from '@as-integrations/fastify';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { apolloMeasurePlugin } from './graphql/plugins/apolloMeasurePlugin';

import routes from './routes';
import path from 'path';
import webhooksApi from './clubApps/WebhookEndpointApp/api/webhooksApi';

export const graphqlLoaders = (app: MestoApp) => ({
});

export async function mestoRouter(app: MestoApp) {
  const env = app.Env;

  // Require the framework and instantiate it
  const r = app.router as any;

  r.register(require('@fastify/static'), {
    root: path.join(app.Env.rootDir, 'static'),
    prefix: '/static/',
  });

  r.register(function (router, opts, next) {
    router.register(webhooksApi(app));
    next();
  }, {prefix: `/m`});

  r.register(function (router, opts, next) {
    router.register(routes(app));
    next();
  }, {prefix: `/${env.apiPrefix}`});

  const typeDefs = mergeTypeDefs([
    'scalar JSON',
    graphqlSchema,
    app.engines.memberProfiles.graphql.typeDefs,
  ]);

  const resolvers = mergeResolvers([
    graphqlResolvers(app as any),
    {
      Query: {
        club: async (_, {slug}, ctx, info) => {
          return await app.m.findOneOrFail(Club, {
            where: {slug},
          });
        },
      }
    },
    app.engines.memberProfiles.graphql.resolvers,
  ]);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create Apollo Server instance
  const apollo = new ApolloServer<{app: MestoApp, auth: any}>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer: r.server }),
      apolloMeasurePlugin(app, {threshold: 300}),
    ],
    formatError: (error) => {
      // Log the error using the app logger
      app.logger.error({
        err: error,
        path: error.path,
        code: error.extensions?.code,
      }, 'GraphQL Error');

      // Return a sanitized error message to the client
      return {
        message: app.env.nodeEnv === 'development' ? error.message : 'Internal server error',
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR'
        }
      };
    },
  });

  // Start Apollo Server
  await apollo.start();

  // Register Apollo middleware
  r.route({
    method: ['GET', 'POST', 'OPTIONS'],
    url: '/graphql',
    handler: fastifyApolloHandler(apollo, {
      context: async (request, reply) => {
        const time = Date.now();
        const auth = app.contexts.auth(request as any);

        const club = await app.m.findOneBy(Club, {id: '1'});
        const user = await auth.getUser();
        if (!user) {
          return {
            app,
            user: null,
            club,
            hub: club,
            member: null,
            can: () => false,
            canOrFail: (resource: string, action: string, obj?: any) => {
              throw new Error(`You are not allowed to ${action} ${resource}`);
            },
            auth: {
              // todo: get rid of extra nesting
              ctx: auth,
            },
          }
        }

        const {value: member, isCreated} = await app.em.findOneOrCreateBy(Member, {
          user: {id: user.id},
          club: {id: club.id},
        }, {});
        if (isCreated) {
          await app.engines.access.service.addRole({member, user, hub: club}, 'guest');
        }
        const memberCtx = await app.engines.access.service.memberCtx(member, user, club);

        const timeEnd = Date.now();
        app.logger.info(`GraphQL auth took ${timeEnd - time}ms`, {
          path: request,
        });

        const canRules = {
          ...app.engines.memberProfiles.canRules,
        }
        const can = async(resource: string, action: string, obj?: any) => {
          const actionRule = canRules[resource]?.[action];
          if (!actionRule) {
            return false;
          }
          return await actionRule({member, hasRole: (roleSlug: string) => memberCtx.hasRole(roleSlug)}, obj);
        }

        const canOrFail = async (resource: string, action: string, obj?: any) => {
          if (await can(resource, action, obj)) {
            return true;
          }
          throw new Error(`You are not allowed to ${action} ${resource}`);
        }

        return {
          app,
          user,
          club,
          hub: club,
          member,
          can,
          canOrFail,
          auth: {
            // todo: get rid of extra nesting
            ctx: auth,
          },
        }
      }
    })
  });

  console.log(app.Env.nodeEnv)
  if (app.Env.nodeEnv === 'development') {
    r.get('/api/login/:userId', (req, res) => {
      app.auth.logIn(req.params.userId, req.session);
      res.send({ logged: true });
    });
  }

  return r;
}