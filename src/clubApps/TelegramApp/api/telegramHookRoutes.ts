import {TelegramBotUpdates} from '../TelegramBotUpdates'

export default function (deps: {TelegramBotUpdates: TelegramBotUpdates}) {
  return function (router, opts, next) {
    router.post('/:key', async function (request, reply) {
      const key = request.params.key;
      const body = request.body;

      console.log(body);

      const result = await deps.TelegramBotUpdates.onTelegramUpdate(body, key);

      if (result?.error) {
        reply.send({ok: false});
      } else {
        reply.send({ok: true});
      }
    });

    router.get('/:key', async function (request, reply) {
      reply.send({ok: true});
    });

    next();
  }

}
