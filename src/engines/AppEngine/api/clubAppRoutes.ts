import {enumStr, nullable, num, obj, str} from 'json-schema-blocks'
import ClubApp from '../models/ClubApp'
import ClubAppRole from '../models/ClubAppRole'
import {StatusCodes} from 'http-status-codes'
import ClubRole from '../../../models/ClubRole'
import ExtCode, {ExtCodeTypes} from '../../../models/ExtCode'
import {ExtService} from '../../../lib/enums'
import {eventNames} from '../../MotionEngine/shared/eventNames'
import clubAppRegistryRoutes from './clubAppRegistryRoutes'
import Event from '../../../models/Event'
import AppEngine from '../AppEngine'
import {IsNull} from 'typeorm'
import {ICallResult, IConfigProp, IValueType} from '../../../interfaces/IClubApp'
import ClubAppProp from '../models/ClubAppProp'
import {appRegistry} from '../AppRegistry'
import {MotionActionState} from '../../MotionEngine/models/MotionAction'

export default function (c: AppEngine) {
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
        const value = preprocessProp(prop, data.props[key]);
        const isValid = validateProp(prop, value);
        if (!isValid) throw Error(`"${prop.label}" is not valid`);

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
      if (!clubApp || !await app.engines.accessEngine.memberHasAccessToAppPage(member, clubApp, appPage)) {
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
        action: {
          actionName,
          error: actionData?.state === MotionActionState.failed ? actionData?.error : undefined,
          result: actionData?.state === MotionActionState.done ? actionData?.data : undefined,
        }
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

      const club = await c.app.repos.club.findBySlugOrFail(clubSlug);

      //todo: make dynamic and get from app from database
      if (appSlug === 'typeform') {

        const body: {
          event_id: string,
          event_type: 'form_response' | string,
          form_response: {
            form_id: string,
            token: string,
            submitted_at: string,
            landed_at: string,
            hidden:{
              clubeeo_token: string
            },
          }
        } = req.body;

        if (body.event_type === 'form_response') {
          const code = body.form_response?.hidden?.clubeeo_token;

          const extCode = await c.app.m.findOneBy(ExtCode, {
            code,
            service: ExtService.typeform,
            codeType: ExtCodeTypes.webhook,
          });

          if (extCode && !extCode.used) {
            await c.app.repos.extCode.markUsed(extCode);

            await c.app.engines.motionEngine.processEvent(eventNames.typeform.completed, {
              club,
              user: {id: extCode.userId},
            }, {
              extCodeId: extCode.id,
              //todo: appId
              log: {
                code,
                extCode,
              }
            });
          } else if (!extCode) {
            c.app.log.warn('webhook received: extCode if not found', {data: {clubSlug, appSlug, code, extCode, body: req.body}});
          }
        }
      }

      resp.send({
        ok: true
      });
    });

    next();
  }
}

/**
 * https://developer.typeform.com/webhooks/example-payload/

{
  "event_id": "LtWXD3crgy",
  "event_type": "form_response",
  "form_response": {
    "form_id": "lT4Z3j",
    "token": "a3a12ec67a1365927098a606107fac15",
    "submitted_at": "2018-01-18T18:17:02Z",
    "landed_at": "2018-01-18T18:07:02Z",
    "calculated": {
      "score": 9
    },
    "variables": [
      {
        "key": "score",
        "type": "number",
        "number": 4
      },
      {
        "key": "name",
        "type": "text",
        "text": "typeform"
      }
    ],
    "hidden":{
      "user_id": "abc123456"
    },
    "definition": {
      "id": "lT4Z3j",
      "title": "Webhooks example",
      "fields": [
        {
          "id": "DlXFaesGBpoF",
          "title": "Thanks, {{answer_60906475}}! What's it like where you live? Tell us in a few sentences.",
          "type": "long_text",
          "ref": "[readable_ref_long_text",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "SMEUb7VJz92Q",
          "title": "If you're OK with our city management following up if they have further questions, please give us your email address.",
          "type": "email",
          "ref": "readable_ref_email",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "JwWggjAKtOkA",
          "title": "What is your first name?",
          "type": "short_text",
          "ref": "readable_ref_short_text",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "KoJxDM3c6x8h",
          "title": "When did you move to the place where you live?",
          "type": "date",
          "ref": "readable_ref_date",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "PNe8ZKBK8C2Q",
          "title": "Which pictures do you like? You can choose as many as you like.",
          "type": "picture_choice",
          "ref": "readable_ref_picture_choice",
          "allow_multiple_selections": true,
          "allow_other_choice": false
        },
        {
          "id": "Q7M2XAwY04dW",
          "title": "On a scale of 1 to 5, what rating would you give the weather in Sydney? 1 is poor weather, 5 is excellent weather",
          "type": "number",
          "ref": "readable_ref_number1",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "gFFf3xAkJKsr",
          "title": "By submitting this form, you understand and accept that we will share your answers with city management. Your answers will be anonymous will not be shared.",
          "type": "legal",
          "ref": "readable_ref_legal",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "k6TP9oLGgHjl",
          "title": "Which of these cities is your favorite?",
          "type": "multiple_choice",
          "ref": "readable_ref_multiple_choice",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "RUqkXSeXBXSd",
          "title": "Do you have a favorite city we haven't listed?",
          "type": "yes_no",
          "ref": "readable_ref_yes_no",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "NRsxU591jIW9",
          "title": "How important is the weather to your opinion about a city? 1 is not important, 5 is very important.",
          "type": "opinion_scale",
          "ref": "readable_ref_opinion_scale",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "WOTdC00F8A3h",
          "title": "How would you rate the weather where you currently live? 1 is poor weather, 5 is excellent weather.",
          "type": "rating",
          "ref": "readable_ref_rating",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "pn48RmPazVdM",
          "title": "On a scale of 1 to 5, what rating would you give the general quality of life in Sydney? 1 is poor, 5 is excellent",
          "type": "number",
          "ref": "readable_ref_number2",
          "allow_multiple_selections": false,
          "allow_other_choice": false
        },
        {
          "id": "M5tXK5kG7IeA",
          "title": "Book a time with me",
          "type": "calendly",
          "ref": "readable_ref_calendly",
          "properties": {}
        }
      ]
    },
    "answers": [
      {
        "type": "text",
        "text": "It's cold right now! I live in an older medium-sized city with a university. Geographically, the area is hilly.",
        "field": {
          "id": "DlXFaesGBpoF",
          "type": "long_text"
        }
      },
      {
        "type": "email",
        "email": "laura@example.com",
        "field": {
          "id": "SMEUb7VJz92Q",
          "type": "email"
        }
      },
      {
        "type": "text",
        "text": "Laura",
        "field": {
          "id": "JwWggjAKtOkA",
          "type": "short_text"
        }
      },
      {
        "type": "date",
        "date": "2005-10-15",
        "field": {
          "id": "KoJxDM3c6x8h",
          "type": "date"
        }
      },
      {
        "type": "choices",
        "choices": {
          "labels": [
            "London",
            "Sydney"
          ]
        },
        "field": {
          "id": "PNe8ZKBK8C2Q",
          "type": "picture_choice"
        }
      },
      {
        "type": "number",
        "number": 5,
        "field": {
          "id": "Q7M2XAwY04dW",
          "type": "number"
        }
      },
      {
        "type": "boolean",
        "boolean": true,
        "field": {
          "id": "gFFf3xAkJKsr",
          "type": "legal"
        }
      },
      {
        "type": "choice",
        "choice": {
          "label": "London"
        },
        "field": {
          "id": "k6TP9oLGgHjl",
          "type": "multiple_choice"
        }
      },
      {
        "type": "boolean",
        "boolean": false,
        "field": {
          "id": "RUqkXSeXBXSd",
          "type": "yes_no"
        }
      },
      {
        "type": "number",
        "number": 2,
        "field": {
          "id": "NRsxU591jIW9",
          "type": "opinion_scale"
        }
      },
      {
        "type": "number",
        "number": 3,
        "field": {
          "id": "WOTdC00F8A3h",
          "type": "rating"
        }
      },
      {
        "type": "number",
        "number": 4,
        "field": {
          "id": "pn48RmPazVdM",
          "type": "number"
        }
      },
      {
        "type": "url",
        "url": "https://calendly.com/scheduled_events/EVENT_TYPE/invitees/INVITEE",
        "field": {
          "id": "M5tXK5kG7IeA",
          "type": "calendly",
          "ref": "readable_ref_calendly"
        }
      }
    ]
  }
}

 */
