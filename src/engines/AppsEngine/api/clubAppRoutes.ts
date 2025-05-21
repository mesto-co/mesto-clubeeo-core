import {enumStr, nullable, num, obj, str} from 'json-schema-blocks'
import ClubApp from '../models/ClubApp'
import ClubAppRole from '../models/ClubAppRole'
import {StatusCodes} from 'http-status-codes'
import ClubRole from '../../../models/ClubRole'
import clubAppRegistryRoutes from './clubAppRegistryRoutes'
import Event from '../../../models/Event'
import AppsEngine from '../AppsEngine'
import {IsNull} from 'typeorm'
import {ICallResult, IConfigProp, IValueType} from '../IClubApp'
import ClubAppProp from '../models/ClubAppProp'
import {appRegistry} from '../AppsRegistry'

export default function (c: AppsEngine) {
  const app = c.app;

  const validateProp = (prop: IConfigProp<any>, value: IValueType) => {
    if (prop.validate instanceof Function) {
      return prop.validate({app}, value);
    }

    if (prop.type === 'string') {
      return typeof value === 'string';
    }

    return false;
  }

  return function (router, opts, next) {
    router.get('/', async (req, resp) => {
      resp.send({
        message: 'please use POST'
      });
    });

    router.register(clubAppRegistryRoutes(c.app), {prefix: '/registry'});

    router.get('/club-apps', {
      schema: {
        params: obj({
          clubSlug: str(),
        }),
        query: obj({
          filterMode: enumStr('event', 'action')
        }, {required: []})
      },
    }, async (req, resp) => {
      const ctxMember = await c.app.auth.getUserInClubContext(req);
      await ctxMember.requireRole('admin');
      const club = ctxMember.club;
      const filterMode = req.query.filterMode;

      const clubApps = await c.app.m.find(ClubApp, {
        where: {
          club: {id: club.id},
        },
        order: {
          id: 'DESC',
        }
      });

      const result = [];
      for (const clubApp of clubApps) {
        if (filterMode) {
          const appConfig = appRegistry[clubApp.appName];
          if (!appConfig) continue;
          if (filterMode === 'event' && Object.keys(appConfig.events).length === 0) continue;
          if (filterMode === 'action' && Object.keys(appConfig.actions).length === 0) continue;
        }

        result.push({
          ...clubApp,
          app: appRegistry[clubApp.appName] || {},
        })
      }

      resp.send({
        clubApps: result,
      });
    });

    router.get('/club-apps/:appLocator', {
      schema: {
        params: {
          clubSlug: str(),
        },
      },
    }, async (req, resp) => {
      const ctxMember = await c.app.auth.getUserInClubContext(req);
      await ctxMember.requireRole('admin');
      const club = ctxMember.club;

      const clubApp = await c.repos.clubApp.findByLocator(club, req.params.appLocator);

      const appItem = await c.app.clubAppFactory.getApp(clubApp.appName, club, clubApp);

      const result = {
        ...clubApp,
        app: appItem,
      };

      resp.send({
        clubApp: result,
      });
    });

    router.put('/club-apps/:appLocator', {
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
        menuIndex: number | null,
        appSlug: string,
        props: Record<string, string>
      } = req.body;

      const clubApp = await c.repos.clubApp.findByLocator(club, req.params.appLocator);

      const appItem = await app.clubAppFactory.getApp(clubApp.appName, club, null);
      if (!appItem) {
        throw Error(`app "${clubApp.appName}" can't be updated`);
      }

      //todo: generalize with registry install
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
        const value = preprocessProp(prop as IConfigProp<any>, data.props[key]);
        const isValid = validateProp(prop as IConfigProp<any>, value);
        if (!isValid) throw Error(`"${prop['label']}" is not valid`);

        config[key] = value as string;
      }

      clubApp.config = config;
      clubApp.menuIndex = data.menuIndex || null;
      clubApp.title = data.title;
      clubApp.appSlug = data.appSlug;

      await app.m.save(clubApp);

      for (const [key, prop] of Object.entries(config)) {
        await app.em.findOneOrCreateBy(ClubAppProp, {
          club: {id: club.id},
          clubApp: {id: clubApp.id},
          key,
        }, {
          appKey: clubApp.appName,
          value: String(prop),
        })
      }

      resp.send({
        app: appItem,
        clubApp,
      });
    });


    router.get('/club-apps/:appLocator/event-logs', {
      schema: {
        params: {
          clubSlug: str(),
          appSlug: str(),
        },
      },
    }, async (req, resp) => {
      const ctxMember = await c.app.auth.getUserInClubContext(req);
      await ctxMember.requireRole('admin');
      const club = ctxMember.club;

      const clubApp = await c.repos.clubApp.findByLocator(club, req.params.appLocator);
      const where = {}

      // core events doesn't have clubAppId
      if (clubApp.appName === 'clubeeo-app') {
        where['clubApp'] = IsNull();
      } else {
        where['clubApp'] = {id: clubApp.id};
      }

      const events = await c.app.m.find(Event, {
        where,
        order: {
          id: 'DESC',
        },
        relations: {
          actions: true
        },
        take: 100,
      });

      resp.send({
        events,
      });
    });

    router.get('/:appSlug/config', {
      schema: {
        params: obj({
          clubSlug: str(1),
          appSlug: str(1),
        }),
        query: obj({
          appPage: nullable(str()),
        })
      }
    }, async (req, reply) => {
      const userCtx = await c.app.auth.getUserContext(req);

      const clubSlug = req.params.clubSlug;
      const appSlug = req.params.appSlug;
      const appPage = req.query.appPage;
      const club = await c.app.repos.club.findBySlugOrFail(clubSlug);

      const memberCtx = await userCtx.inClubContext(club);
      const { value: member } = await memberCtx.fetchMember();

      const clubApp = await c.app.m.findOneByOrFail(ClubApp, {
        club: {id: club.id},
        appSlug,
      });

      // const hasAccessToApp = await c.app.engines.accessEngine.memberHasAccessToApp(member, clubApp);
      // if (!hasAccessToApp) {
      //   return reply
      //     .code(StatusCodes.FORBIDDEN)
      //     .send({error: 'access denied'})
      // }
      if (!clubApp || !member || !await app.engines.accessEngine.memberHasAccessToAppPage(member, clubApp as any, appPage)) {
        return reply.code(StatusCodes.FORBIDDEN).send({ error: 'access denied' });
      }

      const appConfig = appRegistry[clubApp.appName];

      let pageData = {};
      const pageConfig = appConfig?.pages?.[appPage || ''];
      if (pageConfig) {
        pageData = await pageConfig.data({
          app, club, clubApp, member,
        })
      }

      const response = {
        club: {
          id: club.id
        },
        clubApp: {
          id: clubApp.id,
          title: clubApp.title,
          appName: clubApp.appName,
          appSlug: clubApp.appSlug,
        },
        publicConfig: clubApp.publicConfig,
        appPage: {
          appPage,
          data: pageData,
        }
      }

      if (await memberCtx.hasRole('admin')) {
        const roles = await c.app.m.find(ClubAppRole, {
          where: {
            clubApp: {id: clubApp.id},
          },
          relations: {
            clubRole: true,
          }
        });

        response['roles'] = roles;
      }

      reply.send({
        data: response,
      });
    });

    router.post('/:appSlug/action/:action', {
      schema: {
        params: obj({
          clubSlug: str(1),
          appSlug: str(1),
          action: str(1),
        }),
        query: obj({
          appPage: nullable(str()),
        })
      }
    }, async (req, reply) => {
      const userCtx = await c.app.auth.getUserContext(req);

      const clubSlug = req.params.clubSlug;
      const appSlug = req.params.appSlug;
      const actionName = req.params.action;
      const appPage = req.query.appPage;
      const data = req.body?.data || {};
      const club = await c.app.repos.club.findBySlugOrFail(clubSlug);

      const memberCtx = await userCtx.inClubContext(club);
      const { value: member } = await memberCtx.fetchMember();

      const clubApp = await c.app.m.findOneByOrFail(ClubApp, {
        club: {id: club.id},
        appSlug,
      });

      if (!clubApp || !await app.engines.accessEngine.memberHasAccessToAppAction(member, clubApp, actionName)) {
        return reply.code(StatusCodes.FORBIDDEN).send({ error: 'access denied' });
      }

      const appConfig = appRegistry[clubApp.appName];

      let actionData: null | ICallResult = null;
      const action = appConfig?.actions?.[actionName];
      if (action) {
        const emit = async (event: string, data: Record<string, unknown>): Promise<void> => {
          await app.engines.motionEngine.processEvent(event, {
            club, clubApp, member,
          }, data);
        }

        actionData = await action.call({
          app, club, clubApp, member, emit, caller: 'member',
        }, data);
      }

      const response = {
        club: {
          id: club.id
        },
        clubApp: {
          id: clubApp.id,
          title: clubApp.title,
          appName: clubApp.appName,
          appSlug: clubApp.appSlug,
        },
        // action: {
        //   actionName,
        //   error: actionData?.state === MotionActionState.failed ? actionData?.error : undefined,
        //   result: actionData?.state === MotionActionState.done ? actionData?.data : undefined,
        // }
      }

      reply.send(response);
    });

    router.post('/:appSlug/roles', {
      schema: {
        params: obj({
          clubSlug: str(1),
          appSlug: str(1),
        }),
        body: obj({
          roles: obj({}, {additionalProperties: true})
        })
      }
    }, async (req, reply) => {
      const cMember = await c.app.auth.getUserInClubContext(req);
      await cMember.requireRole('admin');
      const club = cMember.club;

      const clubApp = await c.app.repos.clubApp.findBySlugOrFail(club, req.params.appSlug);

      for (const [roleId, roleEnabled] of Object.entries(req.body.roles)) {
        const role = await c.app.m.findOneByOrFail(ClubRole, {
          id: roleId,
          club: {id: cMember.club.id},
        });

        if (roleEnabled) {
          await c.app.em.findOneOrCreateBy(ClubAppRole, {
            clubRole: {id: role.id},
            clubApp: {id: clubApp.id},
          }, {});
        } else {
          await c.app.m.delete(ClubAppRole, {
            clubRole: {id: role.id},
            clubApp: {id: clubApp.id},
          });
        }
      }

      reply.send({
        ok: true,
      });
    });

    // https://clubeeo.com/api/club/aspis/app/typeform/webhook
    router.post('/:appSlug/webhook', {
      schema: {
        params: obj({
          clubSlug: str(1),
          appSlug: str(1),
        })
      }
    }, async (req, resp) => {
      const clubSlug = req.params.clubSlug;
      const appSlug = req.params.appSlug;

      c.app.log.info('webhook received', {data: {clubSlug, appSlug, body: req.body}});

      resp.send({
        ok: true
      });
    });

    next();
  }
}
