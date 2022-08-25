import {obj, str} from 'json-schema-blocks';
import App from '../../App';
import NftCollection from '../../models/NftCollection'
import NftItem from '../../models/NftItem'

export default function (app: App) {
  return function (router, opts, next) {
    router.get('/:nftSlug/:itemId', {
      schema: {
        description: 'Club list',
        params: obj({
          nftSlug: str(1),
          itemId: str(1),
        }),
        response: {
          200: obj({
            name: str(),
            description: str(),
            image: str(),
          }, {additionalProperties: true})
        }
      },
    }, async (req, resp) => {
      const slug = req.params.nftSlug;
      const itemId = req.params.itemId;

      const collection = await app.m.findOneByOrFail(NftCollection, {slug});

      let item = await app.m.findOneBy(NftItem, {
          collection: {id: collection.id},
          eid: itemId,
      });
      if (!item) {
        item = await app.m.findOne(NftItem, {
          where: {
            collection: {id: collection.id},
            default: true
          },
          order: {id: 'DESC'}
        });
      }

      resp.send({
        name: item.name,
        description: item.description,
        image: item.image,
        ...item.meta,
      });
    });

    next();
  }
}
