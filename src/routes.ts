import App from './App';

import clubRoutes from './api/clubRoutes';
import walletRoutes from './api/walletRoutes';
import debugRoutes from './api/debugRoutes';
import authRoutes from './api/auth/authRoutes';
import web3Routes from './api/web3Routes';
import telegramAuthRoutes from './api/telegram/telegramAuthRoutes'
import nftMetaRoutes from './api/nft/nftMetaRoutes'
import clubMembersRoutes from './api/club/clubMembersRoutes'
import clubAppsRoutes from './api/clubAppsRoutes'
import clubFormsRoutes from './api/club/clubFormsRoutes'
import membersManagerAppRoutes from './clubApps/MembersManagerApp/api/membersManagerAppRoutes'

export default function (app: App) {
  return function (router, opts, next) {
    router.register(authRoutes(app), {prefix: '/auth'});

    router.register(clubRoutes(app), {prefix: '/club'});

    router.register(clubAppsRoutes(app), {prefix: '/clubApps'});

    router.register(clubMembersRoutes(app), {prefix: '/club/:clubSlug/userRoles'});

    router.register(clubFormsRoutes(app), {prefix: '/club/:clubId/applications'});

    router.register(nftMetaRoutes(app), {prefix: '/nft'});

    router.register(debugRoutes(app), {prefix: '/debug'});

    router.register(telegramAuthRoutes(app), {prefix: '/telegram/auth'});

    router.register(walletRoutes(app), {prefix: '/wallet'});

    router.register(web3Routes(app), {prefix: '/web3'});

    router.register(app.DiscordContainer.discordAppRoutes, {prefix: '/apps/discord'});

    router.register(membersManagerAppRoutes(app), {prefix: '/club/:clubId/apps/membersManager'});

    router.register(app.TelegramContainer.telegramHookRoutes, {prefix: '/telegram/hook'});

    next();
  }
}
