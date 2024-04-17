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

  router.register(require('@fastify/multipart'));
  router.register(require('@fastify/formbody'));

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

  if (env.nodeEnv === 'development') {
    router.register(require('@fastify/swagger'), {
      routePrefix: '/docs',
      swagger: {
        info: {
          title: 'Test swagger',
          description: 'Testing the Fastify swagger API',
          version: '0.1.0'
        },
        externalDocs: {
          url: 'https://swagger.io',
          description: 'Find more info here'
        },
        host: 'localhost',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'user', description: 'User related end-points' },
          { name: 'code', description: 'Code related end-points' }
        ],
        definitions: {
          User: {
            type: 'object',
            required: ['id', 'email'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: {type: 'string', format: 'email' }
            }
          }
        },
        securityDefinitions: {
          apiKey: {
            type: 'apiKey',
            name: 'apiKey',
            in: 'header'
          }
        }
      },
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      },
      uiHooks: {
        onRequest: function (request, reply, next) { next() },
        preHandler: function (request, reply, next) { next() }
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      exposeRoute: true
    });
  }

  router.register(function (router, opts, next) {
    router.register(webhooksApi(app));
    next();
  }, {prefix: `/m`});

  router.register(function (router, opts, next) {
    router.register(routes(app));
    next();
  }, {prefix: `/${env.apiPrefix}`});

  // Run the server
  router.listen({port: env.port, host: env.host}, function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.info(`server listening on ${address}`);
  })
}
