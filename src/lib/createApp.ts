import { App } from "clubeeo-core";
// import Member from "clubeeo-core/dist/models/Member";
// import { IFastifySession } from "clubeeo-core/dist/types/services/AuthService";
import { FastifyInstance } from "fastify";

// export function createApp<TApp extends App>(name: string, options: {
//   routes?: (c: TApp, fastify: FastifyInstance & {
//     session: IFastifySession;
// }) => void;
// }) {
//   return function(c: TApp) {
//     // register routes
//     if (options.routes) {
//       // todo: rename to fastify in clubeeo-core
//       c.router.register((r, opts, next) => {
//         options.routes(c, r as any);
//         next();
//       }, {prefix: `/${c.Env.apiPrefix}/club/:clubId/apps/:appSlug/${name}`});
//     }
//   }
// }

export type TAppBuilderHandler<TApp extends App> = (c: TApp, req: any, reply: any) => Promise<any>;

export class AppBuilder<TApp extends App> {
  routes: Record<string, {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    opts: any,
    path: string,
    handler: (c: TApp, req: any, reply: any) => Promise<any>,
  }> = {};

  constructor(protected name: string) {}

  get(path: string, opts: any, handler: TAppBuilderHandler<TApp>) {
    return this.route(path, opts, 'GET', handler);
  }

  post(path: string, opts: any, handler: TAppBuilderHandler<TApp>) {
    return this.route(path, opts, 'POST', handler);
  }

  put(path: string, opts: any, handler: TAppBuilderHandler<TApp>) {
    return this.route(path, opts, 'PUT', handler);
  }

  patch(path: string, opts: any, handler: TAppBuilderHandler<TApp>) {
    return this.route(path, opts, 'PATCH', handler);
  }

  delete(path: string, opts: any, handler: TAppBuilderHandler<TApp>) {
    return this.route(path, opts, 'DELETE', handler);
  }

  route(path: string, opts: any, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', handler: TAppBuilderHandler<TApp>) {
    this.routes[method + ':' + path] = {method, opts, path, handler};
    return this;
  }

  attachTo(c: TApp) {
    this.registerRoutes(c, c.router);
  }

  registerRoutes(c: TApp, router: FastifyInstance) {
    c.router.register((r, opts, next) => {
      for (const route of Object.values(this.routes)) {
        r[route.method.toLowerCase()](route.path, route.opts, async (req, reply) => {
          const clubId = req.params.clubId as string;
          const {user} = await c.auth.getUserContext(req as any);
          const member = await c.m.findOneByOrFail('Member', {user: {id: user.id}, club: {id: clubId}});

          req.ctx = {
            user,
            member,
          };
          
          return await route.handler(c, req, reply);
        });
      }
      next();
    }, {prefix: `/${c.Env.apiPrefix}/club/:clubId/apps/:appSlug/${this.name}`});
  }
}
