import {router} from 'clubeeo-core';
import {MestoApp} from './App';

export function mestoRouter(app: MestoApp) {
  const r = router(app);

  console.log(app.Env.nodeEnv)
  if (app.Env.nodeEnv === 'development') {
    r.get('/api/login/:userId', (req, res) => {
      app.auth.logIn(req.params.userId, req.session);
      res.send({ logged: true });
    });
  }

  return r;
}