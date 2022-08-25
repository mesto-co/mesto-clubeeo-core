export interface IContextData {
  traceId?: number
  userId?: number
  clubId?: number
  walletId?: number
  chain?: number
}

export default class ContextData implements IContextData {
  traceId?: number
  userId?: number
  clubId?: number
  walletId?: number
  chain?: number
}
