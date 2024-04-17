import App from '../../App';
import {obj, str} from 'json-schema-blocks';

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/', {
      schema: {
        params: obj({
          clubSlug: str(),
          pageSlug: str(),
        }),
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req);
      const club = await app.repos.club.findBySlugOrFail(req.params.clubSlug);
      const pageSlug = req.params.pageSlug;

      // if (pageSlug === 'root') { // temporary hardcode
      //   const stepsSnippet = await snippets.onboardingTasks(app, pageSlug, club, user);
      //
      //   resp.send({
      //     page: {
      //       type: 'landing-with-aside',
      //       asidePosition: club.style['aside'] || 'left',
      //       main: {
      //         type: 'main-fallback',
      //       },
      //       aside: {
      //         type: 'aside-3',
      //         top: {},
      //         middle: stepsSnippet,
      //         bottom: {},
      //       },
      //     },
      //   });
      // } else

      if (pageSlug === 'dev') {
        resp.send({
          page: {
            dev: true
          }
        });
      } else {
        resp.send({
          page: {

          }
        });
      }
    });

    next();
  }
}
