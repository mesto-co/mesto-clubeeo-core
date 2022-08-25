import App from '../../../App';
import {arr, id, obj, str} from 'json-schema-blocks'
import User from '../../../models/User'
import {In} from 'typeorm'
import {UserExtMessageBatch} from '../../../models/UserExtMessageBatch'
import sanitizeHtml from 'sanitize-html';

// https://core.telegram.org/bots/api#html-style

const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 's', 'strike', 'u', 'ins', 'del', 'tg-spoiler', 'a', 'code', 'pre'],
  allowedAttributes: {
    'a': [ 'href' ],
    'code': ['class'],
    // 'span': ['class'], 'tg-spoiler'
  },
}

export default function (app: App) {
  return function (router, opts, next) {
    router.post('/batchSendMessages', {
      params: obj({
        clubId: id()
      }),
      body: obj({
        userIds: arr(id()),
        message: str(1),
      })
    }, async (request, reply) => {
      const user = await app.auth.getUser(request);
      const club = await app.repos.club.findByIdOrFail(request.params.clubId);
      const userInClub = app.contexts.userInClub(user, club);

      await userInClub.requireRole('admin');

      const messageText = request.body.message;

      const sanitizedMessageText = sanitizeHtml(
        messageText
          .replace(/<br\s?\/?>/g, "\n")
          .replace(/\n?<\/p>/g, "\n</p>")
        ,
        sanitizeOptions
      );

      const userIds = request.body.userIds as number[];
      const message = `<strong>${club.name}</strong>:\n\n${sanitizedMessageText}`;

      const batch = app.m.create(UserExtMessageBatch, {
        sender: {id: user.id},
        club: {id: club.id},
        message,
        data: {
          raw: messageText,
        }
      });
      await app.m.save(batch);

      const receivers = await app.m.find(User, {
        where: {
          id: In(userIds),
        },
        relations: {
          userExts: true
        }
      });

      let sendCounter = 0;
      for (const receiver of receivers) {
        await app.userSender.sendToUser(receiver, message, {
          batchId: batch.id,
          senderId: user.id,
          clubId: club.id,
          onSend: () => {
            sendCounter+= 1;
          }
        })
      }

      batch.isSent = true;
      batch.counter = sendCounter;
      await app.m.save(batch);

      reply.send({ok: true});
    });

    next();
  }

}
