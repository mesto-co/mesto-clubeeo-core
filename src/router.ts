import {router} from 'clubeeo-core';
import {MestoApp} from './App';
import { log } from 'console';

export function mestoRouter(app: MestoApp) {
  const r = router(app);

  if (app.Env.nodeEnv === 'development') {
    r.get('/api/login/:userId', (req, res) => {
      app.auth.logIn(req.query.userId as string, req.session);
      res.send({ logged: true });
    });
  }

  return r;
}