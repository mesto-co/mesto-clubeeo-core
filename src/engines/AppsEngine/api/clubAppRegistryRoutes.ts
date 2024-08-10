import {nullable, num, obj, str} from 'json-schema-blocks'
import ClubApp from '../models/ClubApp'
import ClubAppProp from '../models/ClubAppProp'
import App from '../../../App'
import {IConfigProp, IValueType} from '../../../interfaces/IClubApp'

export default function (app: App) {
  return function (router, opts, next) {

    const validateProp = (prop: IConfigProp<any>, value: IValueType) => {
      if (prop.validate instanceof Function) {
        return prop.validate({app}, value);
      }

      if (prop.type === 'string') {
        return typeof value === 'string';
      }

      return false;
    }

    router.get('/', {
      schema: {
        params: {
          clubSlug: str(),
        },
      },
    }, async (req, resp) => {
      const ctxMember = await app.auth.getUserInClubContext(req);
      await ctxMember.requireRole('admin');
      const club = ctxMember.club;

      const apps = app.clubAppFactory.getRegistry(club);

      resp.send({
        apps,
      });
    });

    router.get('/:appKey', {
      schema: {
        params: {
          clubSlug: str(),
          appKey: str(),
        },
      },
    }, async (req, resp) => {
      const ctxMember = await app.auth.getUserInClubContext(req);
      await ctxMember.requireRole('admin');
      const club = ctxMember.club;

      const appItem = await app.clubAppFactory.getApp(req.params.appKey, club, null);

      resp.send({
        app: appItem,
      });
    });

    router.post('/:appKey/install', {
      schema: {
        params: {
          clubSlug: str(1),
          appKey: str(1),
        },
        body: {
          title: str(1),
          menuIndex: nullable(num()),
          appSlug: str(1),
          props: obj({}, {additionalProperties: true}),
        }
      },
    }, async (req, resp) => {
      const ctxMember = await app.auth.getUserInClubContext(req);
      await ctxMember.requireRole('admin');
      const club = ctxMember.club;

      const data: {
        title: string,
        appSlug: string,
        menuIndex: number | null,
        props: Record<string, string>
      } = req.body;

      const appKey = req.params.appKey;

      const appItem = await app.clubAppFactory.getApp(appKey, club, null);
      if (!appItem) {
        throw Error(`app "${appKey}" can't be installed`);
      }

      const clubApp = app.m.create(ClubApp, {
        title: data.title,
        club: {id: club.id},
        appName: appKey,
        appSlug: data.appSlug,
        menuIndex: data.menuIndex || null,
      });

      const preprocessProp = (prop: IConfigProp<any>, value: IValueType) => {
        let result = value;

        if (prop.editable === false || !result) {
          if (typeof prop.default === 'function') {
            result = prop.default({clubApp});
          } else {
            result = prop.default;
          }
        }

        if (prop.type === 'string' && typeof result === 'number') {
          result = String(result);
        }

        return result;
      }

      const config: Record<string, string> = {};

      for (const [key, prop] of Object.entries(appItem.config.props)) {
        const value = preprocessProp(prop, data.props[key]);
        const isValid = validateProp(prop, value);
        if (!isValid) throw Error(`"${prop.label}" is not valid`);

        config[key] = value as string;
      }

      clubApp.config = config;

      await app.m.save(clubApp);

      for (const [key, prop] of Object.entries(config)) {
        await app.em.createAndSave(ClubAppProp, {
          club: {id: club.id},
          clubApp: {id: clubApp.id},
          appKey: clubApp.appName,
          key,
          value: String(prop),
        })
      }

      resp.send({
        app: appItem,
        clubApp,
      });
    });

    next();
  }
}
