import { TCoreApp } from "./CoreApp";

export function coreWebRun(app: TCoreApp) {
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
