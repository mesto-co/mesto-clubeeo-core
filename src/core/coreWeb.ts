import { CoreApp } from "./CoreApp";

export async function coreWebInit<App extends CoreApp>(app: App) {
  const env = app.Env;

  // Require the framework and instantiate it
  const router = app.router;

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

  router.setErrorHandler(function (error, request, reply) {
    let errorMessage = '';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object') {
      errorMessage = error.message
    }

    app.logger.error({err: error}, errorMessage);

    reply
      .code(error.statusCode || 500)
      .send({
        error: errorMessage || 'Error occurred',
        meta: error,
      });
  });
}

export function coreWebRun<App extends CoreApp>(app: App) {
  const env = app.Env;

  // Run the server
  app.router.listen({port: env.port, host: env.host}, function (err, address) {
    if (err) {
      app.logger.error({err}, 'server start failed');
      process.exit(1);
    }

    app.logger.info(`server listening on ${address}`);
  });
}
