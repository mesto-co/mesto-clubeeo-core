import {router, graphqlResolvers, graphqlSchema} from 'clubeeo-core';
import {MestoApp} from './App';
import mercurius from 'mercurius';
import mercuriusAuth from 'mercurius-auth';

export const graphqlLoaders = (app: MestoApp) => ({
});

export function mestoRouter(app: MestoApp) {
  const r = router(app);

  r.register(mercurius, {
    schema: graphqlSchema,
    resolvers: graphqlResolvers(app as any),
    loaders: graphqlLoaders(app as any),
    graphiql: true,
    // // Add this configuration to disable federation features
    // federationMetadata: false
  });

  r.register(mercuriusAuth, {
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

  console.log(app.Env.nodeEnv)
  if (app.Env.nodeEnv === 'development') {
    r.get('/api/login/:userId', (req, res) => {
      app.auth.logIn(req.params.userId, req.session);
      res.send({ logged: true });
    });
  }

  return r;
}