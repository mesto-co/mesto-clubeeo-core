import App from '../../App'
import {obj, str} from 'json-schema-blocks'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/', {
      schema: {
        params: obj({
          clubSlug: str(),
          widgetLocator: str(),
        }),
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req);
      const club = await app.repos.club.findBySlugOrFail(req.params.clubSlug);
      const widgetLocator = req.params.widgetLocator;

      const result = await app.clubWidgetFactory.build(
        widgetLocator,
        {user, club},
      );

      resp.send(result);
    });

    next();
  }
}
