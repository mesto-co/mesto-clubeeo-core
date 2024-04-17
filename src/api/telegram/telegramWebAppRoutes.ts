import UserExt from '../../models/UserExt'
import {StatusCodes} from 'http-status-codes'
import {ExtService} from '../../lib/enums'
import App from '../../App'
import Member from '../../models/Member'
import ClubExt from '../../models/ClubExt'
import {rpc_errors} from 'near-api-js/lib/utils'
import {IAppMenuItem} from '../../contexts/UserInClubContext'

import Club from '../../models/Club'
import {fetchUserAndExtByExtId} from '../../contexts/UserExtContext'

export default function (app: App) {
  return function (router, opts, next) {
    // router.get('/debug', async (req, resp) => {
    //   const initData = 'query_id=AAFFH5kNAAAAAEUfmQ3mmedg&user=%7B%22id%22%3A228138821%2C%22first_name%22%3A%22Roman%22%2C%22last_name%22%3A%22Exemplarov%22%2C%22username%22%3A%22urvalla%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%7D&auth_date=1666363817&hash=fcfaf320e9ebb76a80daeb413e5b609ccfe6eeca2acebe506f467eccb47fc813';
    //   const clubSlug = 'clubeeo';
    //
    //   const tgAppInitData = app.TelegramContainer.tgAppInitData(initData);
    //
    //   if (!tgAppInitData.isInitDataValid) {
    //     return resp.code(StatusCodes.FORBIDDEN).send({
    //       ok: false,
    //       error: 'Telegram WebApp initData is not valid',
    //     });
    //   }
    //
    //   const userData = tgAppInitData.userData;
    //
    //   const club = await app.repos.club.findBySlugOrFail(clubSlug || 'clubeeo');
    //
    //   let userExt = await app.m.findOne(UserExt, {
    //     where: {
    //       service: ExtService.tg,
    //       extId: String(userData.id),
    //     },
    //     relations: ['user'],
    //   });
    //   let user = userExt?.user;
    //
    //   if (!userExt) {
    //     userExt = await app.em.createAndSave(UserExt, {
    //       service: ExtService.tg,
    //       extId: String(userData.id),
    //       data: userData,
    //     });
    //     user = await app.repos.user.create({
    //       lang: userData.language_code,
    //       screenName: app.repos.user.genScreenName(userData),
    //     });
    //   }
    //
    //   const {value: member} = await app.em.findOneOrCreateBy(Member, {
    //     club: {id: club.id},
    //     user: {id: user.id},
    //   }, {
    //     enabled: true,
    //   })
    //
    //   resp.send({
    //     ok: true,
    //     userData,
    //     userExt,
    //     user,
    //     member,
    //     club,
    //   })
    // })

    // router.get('/chatPhoto', async (req, resp) => {
    //   resp.send(
    //     await app.axios('https://api.telegram.org/file/bot185583708:AAGf0osVzEZXEm0gmT2WYfZFb4mRGp_Pdbc/profile_photos/file_84.jpg'),
    //   );
    // });

    router.post('/load', {}, async (req, resp) => {
      const {initData, clubSlug} = req.body;

      app.log.debug('telegram:load', {
        data: {clubSlug, initData}
      });

      const tgAppInitData = app.TelegramContainer.tgAppInitData(initData);

      if (!tgAppInitData.isInitDataValid) {
        return resp.code(StatusCodes.FORBIDDEN).send({
          ok: false,
          error: 'Telegram WebApp initData is not valid',
        });
      }

      const userData = tgAppInitData.userData;

      const {userExt, user} = await fetchUserAndExtByExtId(app, {
        service: ExtService.tg,
        extId: String(userData.id),
        userData,
      });

      let club: Club;
      if (clubSlug) {
        club = await app.repos.club.findBySlugOrFail(clubSlug);
      } else if (user.activeClubId) {
        club = await app.repos.club.findById(user.activeClubId);
      } else {
        club = await app.repos.club.findBySlugOrFail('clubeeo');
      }

      const memberCtx = await app.contexts
        .club(club)
        .fetchUserInClub({user});
      const member = memberCtx.member;

      await app.auth.logIn(user.id, req.session);

      const clubExts = await app.m.find(ClubExt, {
        where: {
          service: ExtService.tg,
          club: {id: club.id},
        }
      });
      for (const clubExt of clubExts) {
        const chatData = await app.TelegramContainer.Telegram.getChat(clubExt.extId);
        clubExt.cached = {...clubExt.cached, ...chatData};
        const chatInviteLink = clubExt.cached['invite_link'] || clubExt.cached['chatInviteLink'];

        if (!chatInviteLink) {
          try {
            const chatInviteLink = await app.TelegramContainer.Telegram.createChatInviteLink(clubExt.extId, {
              creates_join_request: true,
            });

            clubExt.cached['chatInviteLink'] = chatInviteLink.invite_link;
            await app.m.save(clubExt);
          } catch (e) {
            console.error(e);
          }
        }

        try {
          const chatMembersCount = await app.TelegramContainer.Telegram.getChatMembersCount(clubExt.extId);
          clubExt.cached['chatMembersCount'] = chatMembersCount;
        } catch (e) {
          console.error(e);
        }

        // if (chatData.photo.small_file_id) {
        //   clubExt.cached['chatPhotoFile'] = await app.TelegramContainer.Telegram.getFile(chatData.photo.small_file_id);
        // }
      }

      const roles = await memberCtx.roles();
      const badges = await memberCtx.getBadges();
      const isAdmin = await memberCtx.hasRole('admin');

      const menu: Array<{
        app?: IAppMenuItem,
        link?: string,
        title: string,
        caption?: string,
        roles?: any,
        target?: string,
        status?: string,
        info?: string,
        logoImg?: string,
      }> = [];
      for (const clubExt of clubExts) {
        const chatInviteLink = clubExt.cached['invite_link'] || clubExt.cached['chatInviteLink'];

        if (chatInviteLink) {
          menu.push({
            link: chatInviteLink,
            title: clubExt.cached['title'],
            caption: clubExt.cached['type'] ? clubExt.cached['type'] : '',
            status: '',
            info: clubExt.cached['chatMembersCount'] ? `${clubExt.cached['chatMembersCount']} members`: '',
            logoImg: club.style.logoImg,
          })
        }
      }

      menu.push(...(club.settings['menu'] || []));

      const appMenuItems = await memberCtx.getMenuItems();
      for (const appMenuItem of appMenuItems) {
        menu.push({
          app: appMenuItem,
          title: appMenuItem.title,
          logoImg: club.style.logoImg,
          roles: appMenuItem['roles'].map(role => ({name: role.clubRole.name})),
        });
      }

      if (isAdmin) {
        menu.push({
          link: `/${club.slug}/home?telegramLoginCode=${await app.repos.extCode.fetchTgLoginCode(user, club)}`,
          target: '_blank',
          title: 'dashboard',
          roles: [{name: 'admin'}],
          caption: '',
          status: '',
          info: '',
          logoImg: club.style.logoImg,
        });
      }

      resp.send({
        ok: true,
        userData,
        userExt,
        user,
        member,
        club,
        clubExts,
        menu,
        roles,
        badges,
        isAdmin,
      });
    });

    next();

  }
}
