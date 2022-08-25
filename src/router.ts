import App from './App';
import routes from './routes';
import mercurius from 'mercurius';
import {graphqlResolvers} from './graphql/graphqlResolvers'
import {graphqlSchema} from './graphql/graphqlSchema'
import mercuriusAuth from 'mercurius-auth'
import {graphqlLoaders} from './graphql/graphqlLoaders'
import common from 'mocha/lib/interfaces/common'

export default function (app: App) {
  const env = app.Env;

  // Require the framework and instantiate it
  const router = require('fastify')({
    trustProxy: 1,
  });


  router.register(require('@fastify/secure-session'), {
    cookieName: env.sessionCookieName,
    key: env.appSecret,
    cookie: { // options for setCookie, https://github.com/fastify/fastify-cookie
      path: '/',
      httpOnly: true,
      // maxAge: env.sessionCookieTTL, // 14 days
    },
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

  router.setErrorHandler(function (error, request, reply) {
    let errorMessage = '';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object') {
      errorMessage = error.message
    }

    app.log.error(errorMessage, {data: error});

    reply
      .code(error.statusCode || 500)
      .send({
        error: errorMessage || 'Error occurred',
        meta: error,
      });
  });

  router.register(function (router, opts, next) {
    router.register(routes(app));
    next();
  }, {prefix: `/${env.apiPrefix}`});

  // Run the server
  router.listen(env.port, env.host, function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.info(`server listening on ${address}`);
  })
}
