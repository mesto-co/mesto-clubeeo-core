import { Query } from './../node_modules/@apollo/server/src/plugin/schemaReporting/generated/operations.d';
import {router, graphqlResolvers, graphqlSchema, Club} from 'clubeeo-core';
import {MestoApp} from './App';
import { ApolloServer } from '@apollo/server';
import { fastifyApolloHandler } from '@as-integrations/fastify';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ICtx } from 'clubeeo-core/dist/graphql/graphqlCommon';

export const graphqlLoaders = (app: MestoApp) => ({
});

export async function mestoRouter(app: MestoApp) {
  const r = router(app);

  const resolvers = graphqlResolvers(app) as any;

  const schema = makeExecutableSchema({
    typeDefs: graphqlSchema,
    resolvers: graphqlResolvers(app),
  });

  // Create Apollo Server instance
  const apollo = new ApolloServer<{app: MestoApp, auth: any}>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer: r.server })
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
        const auth = app.contexts.auth(request as any);
        return {
          app,
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