import {JSONObject, JSONValue} from '../../lib/common'

export interface IEventInput {
  data: TEvent_Data
  userId: string
}

export type TEvent_Data = Record<string, any>

export interface ITrigger {
  taskType: string
  processor: ITriggerProcessor
  clubId: string
  data: JSONObject
}

export interface ITriggerProcessor {
  type?: string
  opts?: Record<string, any>
}

export interface IProcessor_ExecResult {
  taskType: string
  data: JSONObject
}

export interface IProcessor {
  slug: string
  exec(opts: { trigger: ITrigger, event: IEventInput, config: ITriggerProcessor }): Promise<IProcessor_ExecResult>
}

export interface ITask {
  taskType: string | null,
  data: JSONObject
}