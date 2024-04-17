import App from '../../../App';
import {arr, id, obj, str} from 'json-schema-blocks';
import User from '../../../models/User';
import {ILike, In} from 'typeorm';
import {UserExtMessageBatch} from '../../../models/UserExtMessageBatch';
import {sanitizeHtmlDefault} from '../../../lib/sanitize';
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/members', {
      params: obj({
        clubId: str(1),
      }),
      query: obj({
        // userIds: arr(id()),
        // message: str(1),
      })
    }, async (request, reply) => {
      const userContext = await app.auth.getUserContext(request);
      // await userContext.inClubContext()
      // 'admin');

      // const {searchWallet, searchName, page: pageArg, take: takeArg} = args;
      //
      // const userWhere: FindOptionsWhere<User> = {
      //   userClubRoles: {
      //     club: {id: parent.id},
      //     // enabled: true,
      //   }
      // };
      // if (searchWallet && searchWallet.length >= 4) {
      //   userWhere.wallets = {
      //     address: ILike(searchWallet + '%'),
      //   }
      // }
      // if (searchName && searchName.length >= 3) {
      //   userWhere.screenName = ILike(searchName + '%');
      // }
      //
      // const take = takeArg || 250;
      // const page = pageArg || 1;
      // const skip = (page - 1)*take;
      //
      // const users = await app.m.find(User, {
      //   where: userWhere,
      //   relations: {
      //     userClubRoles: true,
      //     userExts: true,
      //   },
      //   order: {
      //     id: 'DESC',
      //   },
      //   take,
      //   skip,
      // });
      //
      // return users;
      //
      // const users = await app.m.find(User, {
      //   where: {
      //     userClubRoles: {
      //       club: {id: parent.id},
      //       user: userWhere,
      //     }
      //   }
      // });

      // const clubs = await app.m.find(Club, {
      //   where: {
      //     userClubRoles: {
      //       user: {id: user.id},
      //     },
      //   },
      //   order: {id: 'DESC'},
      // });
      //
      // return clubs;




      // id
      // name
      // users {
      //   id
      //   screenName
      //   imgUrl
      //   wallets {
      //     id
      //     address
      //     chain
      //     chainNorm
      //   }
      //   rolesInClub(slug:"${slug.value}") {
      //     id
      //     clubRole {
      //       name
      //     }
      //     clubRoleToken {
      //       clubRole {
      //         name
      //       }
      //     }
      //   }
      // }
    });

    router.post('/batchSendMessages', {
      params: obj({
        clubId: str(1),
      }),
      body: obj({
        userIds: arr(str(1)),
        message: str(1),
      })
    }, async (request, reply) => {
      const user = await app.auth.getUser(request);
      const club = await app.repos.club.findByIdOrFail(request.params.clubId);
      const userInClub = app.contexts.userInClub(user, club);

      await userInClub.requireRole('admin');

      const messageText = request.body.message;

      const sanitizedMessageText = sanitizeHtmlDefault(messageText);

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
