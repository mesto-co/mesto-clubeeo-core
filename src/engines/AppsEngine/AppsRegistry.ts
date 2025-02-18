// import {ClubeeoAppConfig} from '../../clubApps/ClubeeoApp/ClubeeoAppConfig'
// import {LeaderboardAppConfig} from '../../clubApps/LeaderboardApp/LeaderboardAppConfig'
// import {PageAppConfig} from '../../clubApps/PageApp/PageAppConfig'
// import {FeedAppConfig} from '../../clubApps/FeedApp/FeedAppConfig'
// import {WebhookEndpointConfig} from '../../clubApps/WebhookEndpointApp/WebhookEndpointConfig'
import {IAppConfig} from './IClubApp'

export const appRegistry: Record<string, IAppConfig> = {}

function registerApp(appConfig: IAppConfig) {
  appRegistry[appConfig.key] = appConfig;
}

// registerApp(ClubeeoAppConfig);
// registerApp(LeaderboardAppConfig);
// registerApp(FeedAppConfig);
// registerApp(PageAppConfig);
// registerApp(WebhookEndpointConfig);
