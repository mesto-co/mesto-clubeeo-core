import {EvmChainsEnum, MockChainsEnum, NearChainsEnum, TChains} from '../lib/TChains'
import {EvmChainContext} from '../chains/eth/EvmChainContext'
import {NearChainContext} from '../chains/near/NearChainContext'
import {AbstractChainContext} from '../chains/base/AbstractChainContext'
import App from '../App'
import {DummyChainContext} from '../chains/dummy/DummyChainContext'

export function chainContextFactory(app: App, chain: TChains): AbstractChainContext {
  if (chain in EvmChainsEnum) {
    return new EvmChainContext(app);
  } else if (chain in NearChainsEnum) {
    return new NearChainContext();
  } else if (chain in MockChainsEnum) {
    return new DummyChainContext();
  }

  throw `Unknown chain in chainContextFactory: ${chain}`;
}
