import App from '../App';
import {simplePaginator} from '../lib/crudHelpers';
import {ReasonPhrases, StatusCodes} from 'http-status-codes';
import {arr, bool, id, int, nullable, obj, str} from 'json-schema-blocks';
import Wallet from '../models/Wallet';

// fields presented in all requests & responses
export const walletBaseSchema = {
  address: str(),
  chain: str(),
  userId: nullable(id()),
}

// modifiable fields (create & update)
export const walletModifySchema = {
  ...walletBaseSchema
}

// response schema
export const walletViewSchema = {
  id: str(1),
  ...walletBaseSchema,
  createdAt: str(),
  updatedAt: str(),
}

export const walletResponseSchema = {
  wallet: obj(walletViewSchema),
}

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/', {
      schema: {
        description: 'Wallet list',
        query: obj({
          page: id(),
          take: int(1, 1000),
        }, {
          optional: ['page', 'take'],
        }),
        response: {
          200: obj({
            walletList: arr(
              obj(walletViewSchema)
            ),
            pagination: obj({
              page: id(),
              take: int(1, 1000),
              skip: id(),
            })
          })
        }
      },
    }, async (req, resp) => {
      const pagination = simplePaginator(req.query);

      const walletList = await app.m.find(Wallet, {
        order: {id: 'DESC'},
        take: pagination.take,
        skip: pagination.skip,
      });

      resp.send({
        walletList,
        pagination
      });
    });

    router.get('/:walletId', {
      schema: {
        description: 'Show wallet',
        response: {
          200: obj(walletResponseSchema)
        }
      },
    }, async (req, resp) => {
      const walletId = req.params.walletId;

      const wallet = await app.m.findOne(Wallet, {where: {id: walletId}});

      if (wallet) {
        resp.send({
          wallet
        });
      } else {
        resp.code(StatusCodes.NOT_FOUND).send({
          error: 'Wallet is not found'
        });
      }
    });

    router.post('/', {
      schema: {
        description: 'Create wallet',
        body: obj({
          wallet: obj(walletModifySchema)
        }),
        response: {
          200: obj(walletResponseSchema)
        }
      },
    }, async (req, resp) => {
      const user = await app.auth.getUser(req)
      if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});

      const walletData = req.body.wallet;

      app.modelHooks.beforeCreate('wallet', walletData);

      const wallet = app.m.create(Wallet, {
        ...walletData,
        user,
      });
      await app.m.save(wallet);

      app.modelHooks.afterCreate('wallet', wallet);

      resp.send({
        wallet
      });
    });

    router.put('/:walletId', {
      schema: {
        description: 'Update wallet',
        body: obj({
          wallet: obj(walletModifySchema)
        }),
        response: {
          200: obj(walletResponseSchema)
        }
      },
    }, async (req, resp) => {
      const walletId = req.params.walletId;

      const user = await app.auth.getUser(req)
      if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});

      const wallet = await app.m.findOne(Wallet, {where: {id: walletId}});

      if (!wallet) {
        return resp.code(StatusCodes.NOT_FOUND).send({
          error: 'Wallet is not found'
        });
      }

      const walletData = req.body.wallet;

      const prevData = {...wallet};
      app.modelHooks.beforeUpdate('wallet', {...walletData, id: walletId}, prevData);

      Object.assign(wallet, walletData);

      await app.m.save(wallet);

      app.modelHooks.afterUpdate('wallet', wallet, prevData);

      resp.send({
        wallet
      });
    });

    next();
  }

  // todo: DELETE
}
