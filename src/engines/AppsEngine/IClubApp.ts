import ClubApp from './models/ClubApp'
import {MestoApp as App} from '../../App'
import Club from '../../models/Club'
import Member from '../../models/Member'
import MotionAction, {MotionActionState} from '../../engines/MotionEngine/models/MotionAction'
import {Awaitable} from '../../lib/common'

export interface IClubApp {
  appName: string
  clubApp: ClubApp

  getDataFor(opts: any): Promise<any>
}

export type IValueType = string | number | string[]

export interface IOption<T = IValueType> {
  value: T,
  label: string,
  img?: string,
}

interface IProp<C, T = IValueType> {
  key: string,
  type: string,
  label: string,
  description: string,
  editable?: boolean,
  required?: boolean,
  editor?: {
    type: 'select',
    showImage?: boolean,
  } | { type: 'copy' }
    | { type: 'rich-edit' },
  view?: (C, any) => C,
  values?: ((C) => Promise<IOption<T>[]>) | IOption<T>[]
  validate?: (C, T) => Promise<{ ok: IOption<T> } | { error: string }>
  default?: T | ((C) => T)
  group?: string
}

interface IData {
  key: string,
  type: string,
  label: string,
  description: string,
}

export interface IEventProp<C> extends IProp<C> {}
interface IEventOutput extends IData {}
export interface IEvent<C> {
  key: string,
  name: string,
  description: string,
  props: Record<string, IEventProp<C>>,
  output: Record<string, IEventOutput>,
  guard?: ($: { trigger: ITriggerData, event: IEventData}) => boolean,
}
export interface ITriggerData {
  eventProps: Record<string, any>
}
export interface IEventData {
  data: Record<string, any>
}

export interface IAppMutation$ {
  app: App,
  club: Club,
  clubApp: ClubApp,
  member: Member,
  action?: MotionAction,
  caller: 'member' | 'action', // todo: add 'manual'
  emit: (event: string, data: Record<string, unknown>) => void,
}

export type ICallResult<T = unknown> = { state: MotionActionState.done, data: T }
  | { state: MotionActionState.failed, error: string };

interface IActionInput extends IData {}
export interface IActionProp<C> extends IProp<C> {}
export interface IAction<C> {
  key: string,
  name: string,
  description: string,
  props: Record<string, IActionProp<C>>,
  input: Record<string, IActionInput>,
  call?: ($: IAppMutation$, data: Record<string, unknown>) => Awaitable<ICallResult>
}

export interface IConfigProp<C> extends IProp<C> {}
interface IConfig<C> {
  props: Record<string, IConfigProp<C>>,
}

export interface IAppPageConfig$ {
  app: App,
  club: Club,
  clubApp: ClubApp,
  member: Member,
}

export interface IAppPageConfig {
  name: string
  data?: ($: IAppPageConfig$) => any
}

export interface IAppMutationConfig {
  name: string
  call: ($: IAppMutation$, data: Record<string, unknown>) => Awaitable<ICallResult>
}

export interface IAppConfig<C = void> {
  key: string,
  name: string,
  version: string,
  description: string,
  coverImg: string,
  tags: string,
  events: Record<string, IEvent<C>>,
  actions: Record<string, IAction<C>>,
  config: IConfig<C>,
  pages?: Record<string, IAppPageConfig>
  // mutations?: Record<string, IAppMutationConfig>
}
