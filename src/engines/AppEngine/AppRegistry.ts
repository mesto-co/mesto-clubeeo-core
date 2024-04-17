import {ClubeeoAppConfig} from '../../clubApps/ClubeeoApp/ClubeeoAppConfig'
import {LeaderboardAppConfig} from '../../clubApps/LeaderboardApp/LeaderboardAppConfig'
import {PageAppConfig} from '../../clubApps/PageApp/PageAppConfig'
import {EthWalletAppConfig} from '../../clubApps/EthWalletApp/EthWalletAppConfig'
import {EthTokenGatingAppConfig} from '../../clubApps/EthGatingApp/EthWalletAppConfig'
import {FeedAppConfig} from '../../clubApps/FeedApp/FeedAppConfig'
import {WebhookEndpointConfig} from '../../clubApps/WebhookEndpointApp/WebhookEndpointConfig'
import {IAppConfig} from '../../interfaces/IClubApp'

export const appRegistry: Record<string, IAppConfig> = {}

function registerApp(appConfig: IAppConfig) {
  appRegistry[appConfig.key] = appConfig;
}

registerApp(ClubeeoAppConfig);
registerApp(EthTokenGatingAppConfig);
registerApp(EthWalletAppConfig);
registerApp(LeaderboardAppConfig);
registerApp(FeedAppConfig);
registerApp(PageAppConfig);
registerApp(WebhookEndpointConfig);
