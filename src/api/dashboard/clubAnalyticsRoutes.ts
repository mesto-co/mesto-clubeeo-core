import App from '../../App';
import _ from 'lodash';
import {EntityManager} from 'typeorm/index';

const dbNamePattern = /^[A-Za-z0-9_]+$/;

function timeSeriesQuery(app: {m: EntityManager}, opts: {table: string, dateField: string}) {
  if(!opts.table.match(dbNamePattern)) throw new Error(`forbidden table name: "${opts.table}"`);
  if(!opts.dateField.match(dbNamePattern)) throw new Error(`forbidden field name: "${opts.dateField}"`);

  return app.m
    .createQueryBuilder()
    .select("d.generate_series, count(s.id)")
    .from("(SELECT generate_series(now()::date - '30d'::interval, now()::date, '1d'))", "d")
    .leftJoin(opts.table, "s", `s."${opts.dateField}" >= d.generate_series AND s."${opts.dateField}" < d.generate_series + '1d'::interval`)
    .groupBy('d.generate_series')
    .orderBy({'d.generate_series': 'ASC'})
}

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/:dataSet', {}, async (req, resp) => {
      const userCtx = await app.auth.getUserContext(req);
      const club = await app.repos.club.findBySlugOrFail(req.params.clubSlug);
      const userInClub = userCtx.inClubContext(club);
      await userCtx.isPlatformAdmin() || await userInClub.requireRole('admin');

      const dataSet = req.params.dataSet;

      const series = await app.m
        .createQueryBuilder()
        .select("d.generate_series")
        .from("(SELECT generate_series(now()::date - '30d'::interval, now()::date, '1d'))", "d")
        .getRawMany();
      const timestamps = Object.values(series).map(v => Number(v.generate_series));

      if (dataSet === 'member-visits') {

        const result = await timeSeriesQuery(app, {table: 'session', dateField: 'createdAt'})
          .where(`"clubId" = :clubId AND "userId" is not null`)
          .setParameter('clubId', club.id)
          .getRawMany();

        const fetchedData = _.fromPairs(result.map(x => [Number(x.generate_series), Number(x.count)]));

        resp.send({
          data: _.fromPairs(
            timestamps.map(ts => [ts, fetchedData[ts] || 0]),
          ),
        });

      } else if (dataSet === 'anonymous-visits') {

        const result = await timeSeriesQuery(app, {table: 'session', dateField: 'createdAt'})
          .where(`"clubId" = :clubId AND "userId" is null`)
          .setParameter('clubId', club.id)
          .getRawMany();

        const fetchedData = _.fromPairs(result.map(x => [Number(x.generate_series), Number(x.count)]));

        resp.send({
          data: _.fromPairs(
            timestamps.map(ts => [ts, fetchedData[ts] || 0]),
          ),
        });

      } else if (dataSet === 'badges-granted') {

        const result = await timeSeriesQuery(app, {table: 'member_badge', dateField: 'createdAt'})
          .leftJoin("club_badge", "cb", `cb.id = s.clubBadgeId`)
          .where(`cb."clubId" = :clubId`)
          .setParameter('clubId', club.id)
          .getRawMany();

        const fetchedData = _.fromPairs(result.map(x => [Number(x.generate_series), Number(x.count)]));

        resp.send({
          data: _.fromPairs(
            timestamps.map(ts => [ts, fetchedData[ts] || 0]),
          ),
        });

      } else {
        resp.send({
          error: `unknown dataSet "${dataSet}"`,
          data: [],
        });
      }
    });

    next();
  }
}
