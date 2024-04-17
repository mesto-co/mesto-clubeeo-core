import App from '../../App';
import {UserWrap} from '../../models/wraps/UserWrap'
import {ExtService} from '../../lib/enums'
import { format } from '@fast-csv/format'
import UserInClubContext from '../../contexts/UserInClubContext'
import moment from 'moment';

export default function (app: App) {
  return function (router, opts, next) {

    router.get('/export.csv', {

    }, async (req, reply) => {
      const userCtx = await app.auth.getUserContext(req);
      const club = await app.repos.club.findBySlugOrFail(req.params.clubSlug);
      const userInClub = userCtx.inClubContext(club);
      await userCtx.isPlatformAdmin() || await userInClub.requireRole('admin');

      const take = req.query.take;

      const result = await app.repos.user.search(club, {take}, {
        wallets: true,
        userExts: true,
      });

      const csvStream = format({ delimiter: '\t' });

      reply.type('text/csv');
      reply.header('Content-Disposition', 'attachment; filename=members.csv');
      reply.send(csvStream);

      csvStream.write([
        'name',
        'wallet',
        'telegram',
        'badges',
      ]);

      for (const user of result.items) {
        const wUser = new UserWrap(user);
        const userInClub = new UserInClubContext(app, user, club);

        csvStream.write([
          wUser.screenNameView,
          user.wallets.map(w => w.address).join(', '),
          user.userExts.filter(uExt => uExt.service === ExtService.tg).map(w => w.data['from']?.['username']).join(', '),
          (await userInClub.getBadges()).map(b => `${b.clubBadge.title}#${b.index}`),
          moment(await userInClub.joinDate())?.format('YYYY-MM-DD hh:mm:ss'),
        ]);
      }

      csvStream.end();
    });

    next();
  }
}
