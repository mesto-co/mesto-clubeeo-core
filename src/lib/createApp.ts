import { App } from "clubeeo-core";
// import { FastifyInstance } from "fastify";

export type TAppBuilderHandler<TDomain> = (d: TDomain, req: any, reply: any) => Promise<any>;

export class AppBuilder<TApp extends App, TEntity> {
  routes: Record<string, {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    opts: any,
    path: string,
    handler: (c: TEntity, req: any, reply: any) => Promise<any>,
  }> = {};

  _onInit?: (c: TApp, $: TEntity) => Promise<void>;

  constructor(
    protected name: string,
    protected domainFactory: (c: TApp) => TEntity,
  ) {}

  get(path: string, opts: any, handler: TAppBuilderHandler<TEntity>) {
    return this.route(path, opts, 'GET', handler);
  }

  post(path: string, opts: any, handler: TAppBuilderHandler<TEntity>) {
    return this.route(path, opts, 'POST', handler);
  }

  put(path: string, opts: any, handler: TAppBuilderHandler<TEntity>) {
    return this.route(path, opts, 'PUT', handler);
  }

  patch(path: string, opts: any, handler: TAppBuilderHandler<TEntity>) {
    return this.route(path, opts, 'PATCH', handler);
  }

  delete(path: string, opts: any, handler: TAppBuilderHandler<TEntity>) {
    return this.route(path, opts, 'DELETE', handler);
  }

  route(path: string, opts: any, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', handler: TAppBuilderHandler<TEntity>) {
    this.routes[method + ':' + path] = {method, opts, path, handler};
    return this;
  }

  async onInit(fn: (c: TApp, d: TEntity) => Promise<void>) {
    this._onInit = fn;
  }

  async attachTo(c: TApp) {
    const domian = this.domainFactory(c);

    this.registerRoutes(c, domian);

    if (this._onInit) {
      await this._onInit!(c, domian);
    }
  }

  registerRoutes(c: TApp, domian: TEntity) {
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

          return await route.handler(domian, req, reply);
        });
      }
      next();
    }, {prefix: `/${c.Env.apiPrefix}/club/:clubId/apps/:appSlug/${this.name}`});
  }
}
