import { MestoApp as App } from "../../App";
import { Lists } from "./Lists";

export function listsApi(app: App, engine: Lists) {
  return (router, opts, done) => {
    router.get('/:listGroupSlug/search', async (req, reply) => {
      const { listGroupSlug } = req.params;
      let { take, skip } = req.query;
      take = Math.min(parseInt(take) || 20, 1000);
      skip = parseInt(skip) || 0;

      let search = req.query.search;

      return await engine.service.searchItems({
        listGroupSlug, search, take, skip,
      });
    });

    done();
  };
}