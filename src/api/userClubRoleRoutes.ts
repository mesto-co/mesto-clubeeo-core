import App from '../App';
import {simplePaginator} from '../lib/crudHelpers';
import {StatusCodes} from 'http-status-codes';
import {arr, id, int, nullable, obj, str} from 'json-schema-blocks';
import Club from '../models/Club';

// fields presented in all requests & responses
export const clubBaseSchema = {
  name: str(),
  slug: str(),
  description: str(),
  welcome: str(),
  itemsCount: nullable(int()),
  buyLinks: obj({
    opensea: str(),
    rarible: str()
  }, {additionalProperties: true, required: []}),
  socialLinks: obj({
    telegram: str(),
    discord: str(),
    instagram: str(),
    twitter: str(),
    etherscan: str(),
    web: str(),
  }, {additionalProperties: true, required: []}),
  // ownerId: nullable(id()),
}

// modifiable fields (create & update)
export const clubModifySchema = {
  ...clubBaseSchema
}

// response schema
export const clubViewSchema = {
  id: id(),
  ...clubBaseSchema,
  createdAt: str(),
  updatedAt: str(),
}

export const clubResponseSchema = {
  club: obj(clubViewSchema),
}

export default function (app: App) {
  return function (router, opts, next) {
    // router.put('/:clubId', {
    //   schema: {
    //     description: 'User Club Role update',
    //     body: obj({
    //       club: obj(clubModifySchema)
    //     }),
    //     response: {
    //       200: obj(clubResponseSchema)
    //     }
    //   },
    // }, async (req, resp) => {
    //   const clubId = req.params.clubId;
    //
    //   const user = await app.auth.getUser(req.session)
    //   if (!user) return resp.code(StatusCodes.UNAUTHORIZED).send({error: ReasonPhrases.UNAUTHORIZED});
    //
    //   const club = await app.m.findOne(Club, {id: clubId});
    //
    //   if (!club) {
    //     return resp.code(StatusCodes.NOT_FOUND).send({
    //       error: 'Club is not found'
    //     });
    //   }
    //
    //   const clubData = req.body.club;
    //
    //   const prevData = {...club};
    //   app.modelHooks.beforeUpdate('club', {...clubData, id: clubId}, prevData);
    //
    //   Object.assign(club, clubData);
    //
    //   await app.m.save(club);
    //
    //   app.modelHooks.afterUpdate('club', club, prevData);
    //
    //   resp.send({
    //     club
    //   });
    // });

    next();
  }

  // todo: DELETE
}
