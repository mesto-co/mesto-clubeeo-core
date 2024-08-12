import { App } from "clubeeo-core";
import { IFastifySession } from "clubeeo-core/dist/types/services/AuthService";
import { FastifyInstance } from "fastify";

export function createApp<TApp extends App>(name: string, options: {
  routes?: (c: TApp, fastify: FastifyInstance & {
    session: IFastifySession;
}) => void;
}) {
  return function(c: TApp) {
    // register routes
    if (options.routes) {
      // todo: rename to fastify in clubeeo-core
      c.router.register((r, opts, next) => {
        options.routes(c, r as any);
        next();
      }, {prefix: `/${c.Env.apiPrefix}/club/:clubId/apps/:appSlug/${name}`});
    }
  }
}
