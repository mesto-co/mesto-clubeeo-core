import assert = require('assert');
import bcrypt = require('bcrypt');
import {bool, id, nullable, obj, str} from 'json-schema-blocks';
import User from '../../models/User';
import {StatusCodes} from 'http-status-codes';
import {EntityManager} from 'typeorm/index';

const saltRounds = 10;

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface IAuthApp<TUser> {
  auth: {
    getUser(session): Promise<TUser>;
    logIn(userId: string, session);
    logOut(session);
  };
  m: EntityManager;
  nanoid: (size?: number) => string;
}

export default function (app: IAuthApp<User>) {
  return function (router, opts, next) {
    router.get('/me', {
      schema: {
        description: 'Get current user',
        response: {
          200: obj({
            loggedIn: bool(),
            user: nullable(obj({
              id: str(1),
              name: str(),
              email: str(),
              // hasTermsAgree: bool()
            }))
          })
        }
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req.session)
      if (!user) {
        return resp.send({
          loggedIn: false,
          user: null,
        })
      }

      resp.send({
        loggedIn: true,
        user: {
          id: user.id,
          // name: user.name,
          email: user.email,
          // status: user.status,
          // hasTermsAgree: user.hasTermsAgree
        },
      })
    });

    router.post('/login', {
      schema: {
        description: 'Login',
        body: obj({
          email: str(1),
          password: str(1)
        }),
        response: {
          200: obj({
            ok: {const: true}
          })
        }
      },
    }, async (req, reply) => {
      const data: { email: string, password: string } = req.body
      assert(data.email, 'email is required')
      assert(data.password, 'password is required')
      const email = data.email.toLowerCase()

      const user = await app.m.findOneOrFail(User, {where: {email}})
      if (!user) {
        await timeout(500) // to prevent bruteforce
        return reply
          .code(StatusCodes.FORBIDDEN)
          .send({error: 'User not found'})
      }

      if (!await bcrypt.compare(data.password, user.password)) {
        await timeout(500) // to prevent bruteforce
        return reply
          .code(StatusCodes.FORBIDDEN)
          .send({error: 'Wrong password'})
      }

      // if (user.status !== UserStatuses.Active && user.status !== UserStatuses.PlatformAdmin) {
      //   return reply
      //     .code(StatusCodes.FORBIDDEN)
      //     .send({error: 'User is not activated. Rifgo is in closed beta.'})
      // }

      app.auth.logIn(user.id, req.session);

      reply.send({ok: true})
    });

    router.post('/signup', {
      schema: {
        description: 'Sign up',
        body: obj({
          email: str(1),
          password: str(1),
          name: str(1),
          access: bool()
        }),
        response: {
          200: obj({
            ok: {const: true}
          })
        }
      },
    }, async (req, reply) => {
      app.auth.logOut(req.session);

      const data: { email: string, password: string, name: string, access: boolean } = req.body
      const email = data.email.toLowerCase()

      // if (await app.repos.UserRepo.emailTaken(email)) {
      //   await timeout(500) // to prevent bruteforce
      //   reply
      //     .code(StatusCodes.CONFLICT)
      //     .send({error: 'Email already taken'})
      //   return
      // }

      const hash = await bcrypt.hash(data.password, saltRounds)
      const confirmationSecret = app.nanoid(32)

      const user = app.m.create(User, {
        email,
        password: hash,
        // name: data.name,
        confirmationSecret,
        // status: data.access ? UserStatuses.Active : UserStatuses.New
      })
      // auto-active
      // user.status = UserStatuses.Active;
      await app.m.save(user)

      reply.send({ok: true})
    });

    router.post('/forgotPassword', {
      schema: {
        description: 'Password recovery: request secret code',
        body: obj({
          email: str()
        }),
        response: {
          200: obj({
            ok: {const: true}
          })
        }
      },
    }, async (req, reply) => {
      const email = req.body.email;
      const passwordChangeSecret = app.nanoid(32);

      //todo: handle user not found
      const user = await app.m.findOneOrFail(User, {where: {email}});
      user.changePasswordSecret = passwordChangeSecret;
      user.changePasswordCreatedAt = new Date();
      //todo: timelimit
      await app.m.save(user);

      // await new EmailModule(app).sendPasswordRecoveryEmail(user);

      reply.send({ok: true})
    });

    router.post('/changePassword', {
      schema: {
        description: 'Password recovery: submit',
        body: obj({
          secret: str(20),
          password: str(),
        }),
        response: {
          200: obj({
            ok: {const: true}
          })
        }
      },
    }, async (req, reply) => {
      const changePasswordSecret = req.body.secret;
      assert(changePasswordSecret, `passwordChangeSecret can't be empty`);
      const newPassword = req.body.password;

      //todo: handle user not found
      const user = await app.m.findOneOrFail(User, {where: {changePasswordSecret}});

      const hash = await bcrypt.hash(newPassword, saltRounds)
      user.password = hash;
      user.changePasswordSecret = null;

      //todo: check timelimit
      await app.m.save(user);

      reply.send({ok: true});
    });

    router.post('/logout', {
      schema: {
        description: 'Log out',
        response: {
          200: obj({
            ok: {const: true}
          })
        }
      },
    }, async (req, reply) => {
      app.auth.logOut(req.session);

      reply.send({ok: true});
    });

    router.get('/logout', {
      schema: {
        description: 'Log out',
        response: {
          200: obj({
            ok: {const: true}
          })
        }
      },
    }, async (req, reply) => {
      app.auth.logOut(req.session);

      reply.send({ok: true});
    });

    next();
  }
}
