import App from '../App';

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/config', {
      schema: {
        description: 'Global config',
      },
    }, async (req, resp) => {
      resp.send({
        config: app.Env.globalConfig,
      });
    });

    next();
  }
}
