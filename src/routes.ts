import {MestoApp as App} from './App';

import clubRoutes from './api/clubRoutes';
import postRoutes from './api/postRoutes';
import debugRoutes from './api/debugRoutes';
import authRoutes from './api/auth/authRoutes';
import telegramAuthRoutes from './api/telegram/telegramAuthRoutes'
import clubMembersRoutes from './api/club/clubMembersRoutes'
import clubAppsRoutes from './api/clubAppsRoutes'
import clubFormsRoutes from './api/club/clubFormsRoutes'
import membersManagerAppRoutes from './clubApps/MembersManagerApp/api/membersManagerAppRoutes'
import uploadsRoutes from './api/uploadsRoutes'
import clubPageRoutes from './api/club/clubPageRoutes'
import clubConfigRoutes from './api/club/clubConfigRoutes'
import clubWidgetRoutes from './api/club/clubWidgetRoutes'
import clubAnalyticsRoutes from './api/dashboard/clubAnalyticsRoutes'
import clubDashboardMembersRoutes from './api/dashboard/clubMembersRoutes'
import platformClubsAppRoutes from './clubApps/PlatformClubsApp/api/platformClubsAppRoutes'
import telegramWebAppRoutes from './api/telegram/telegramWebAppRoutes'
import webhooksApi from './clubApps/WebhookEndpointApp/api/webhooksApi'
import leaderboardAppRoutes from './clubApps/LeaderboardApp/api/leaderboardAppRoutes'
import pageAppRoutes from './clubApps/PageApp/api/pageAppRoutes'
import globalRoutes from './api/globalRoutes'
import feedAppRoutes from './clubApps/FeedApp/api/feedAppRoutes';
import telegramAppRoutes from './clubApps/TelegramApp/api/telegramAppRoutes';

export default function (app: App) {
  function clubDashboardRoutes(router, opts, next) {
    router.register(clubAnalyticsRoutes(app), {prefix: '/analytics'});

    router.register(clubDashboardMembersRoutes(app), {prefix: '/members'});

    next();
  }

  function clubByIdAppsRoutes(router, opts, next) {

    router.register(telegramAppRoutes(app), {prefix: '/:appId/telegram'});

    // todo: mount each with prefix

    router.register(pageAppRoutes(app));

    router.register(feedAppRoutes(app));

    router.register(leaderboardAppRoutes(app));

    router.register(platformClubsAppRoutes(app), {prefix: '/platformClubs'});

    router.register(membersManagerAppRoutes(app), {prefix: '/membersManager'});

    next();
  }

  return function (router, opts, next) {

    // register all engines with api
    for (const engineName of app.engines.enabledEngines) {
      const engine = app.engines[engineName];

      if ('api' in engine) {
        app.logger.info({engineName}, 'Registering engine API');
        router.register(engine.api, engine.apiConfig);
      }
    }

    router.register(authRoutes(app), {prefix: '/auth'});

    router.register(clubRoutes(app), {prefix: '/club'});

    router.register(clubAppsRoutes(app), {prefix: '/clubApps'});

    router.register(clubConfigRoutes(app), {prefix: '/club/:clubSlug/config'});

    router.register(webhooksApi(app), {prefix: '/club/:clubSlug/webhook'});

    router.register(clubDashboardRoutes, {prefix: '/club/:clubSlug/dashboard'});

    router.register(clubMembersRoutes(app), {prefix: '/club/:clubLocator/member'});

    router.register(clubFormsRoutes(app), {prefix: '/club/:clubId/applications'});

    router.register(clubPageRoutes(app), {prefix: '/club/:clubSlug/page/:pageSlug'});

    router.register(clubWidgetRoutes(app), {prefix: '/club/:clubSlug/widget/:widgetLocator'});

    router.register(globalRoutes(app), {prefix: '/global'});

    router.register(debugRoutes(app), {prefix: '/debug'});

    router.register(postRoutes(app), {prefix: '/post'});

    router.register(telegramWebAppRoutes(app), {prefix: '/telegram/webApp'});

    router.register(telegramAuthRoutes(app), {prefix: '/telegram/auth'});

    router.register(uploadsRoutes(app), {prefix: '/uploads'});

    router.register(clubByIdAppsRoutes, {prefix: '/club/:clubId/apps'});

    router.register(app.TelegramContainer.telegramHookRoutes, {prefix: '/telegram/hook'});

    next();
  }
}
