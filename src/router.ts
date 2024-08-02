import App from './App';
import routes from './routes';
import mercurius from 'mercurius';
import {graphqlResolvers} from './graphql/graphqlResolvers';
import {graphqlSchema} from './graphql/graphqlSchema';
import mercuriusAuth from 'mercurius-auth';
import {graphqlLoaders} from './graphql/graphqlLoaders';
import path from 'path';
import webhooksApi from './clubApps/WebhookEndpointApp/api/webhooksApi';

export default function (app: App) {
  const env = app.Env;

  // Require the framework and instantiate it
  const router = app.router as any;

  router.register(require('@fastify/static'), {
    root: path.join(app.Env.rootDir, 'static'),
    prefix: '/static/',
  });

  router.register(mercurius, {
    schema: graphqlSchema,
    resolvers: graphqlResolvers(app),
    loaders: graphqlLoaders(app),
    graphiql: true
  });

  router.register(mercuriusAuth, {
    authContext: async (context) => {
      return {
        ctx: app.contexts.auth(context.reply.request),
      }
    },
    async applyPolicy (authDirectiveAST, parent, args, context, info) {
      return Boolean(await context.auth.getUser());
    },
    authDirective: 'auth'
  });

  router.register(function (router, opts, next) {
    router.register(webhooksApi(app));
    next();
  }, {prefix: `/m`});

  router.register(function (router, opts, next) {
    router.register(routes(app));
    next();
  }, {prefix: `/${env.apiPrefix}`});

}
