import {router} from 'clubeeo-core';
import {MestoApp} from './App';

export function mestoRouter(app: MestoApp) {
  const r = router(app);

  r.get('/api/hello', (req, res) => {
    app.auth.logIn('1', req.session);
    res.send({ hello: 'world' });
  });

  return r;
}