import { Logging } from "./Logging";

export namespace ExePureCore {
  export interface IAppContainer<TMember extends IMember, TUser extends IUser, THub extends IHub> {
    env: IEnv;
    // s: IServicesContainer<TMember, TUser, THub>;

    logger: Logging.BaseLogger;
    t: TTranslateFn;

    engines: IEngines<TMember, TUser, THub>

    // alias
    ng: IEngines<TMember, TUser, THub>

    // ctx: ICtxFactoryContainer<TMember, TUser, THub>;
    // ee: IEventEmitter;
  }

  export interface IEngines<TMember extends IMember, TUser extends IUser, THub extends IHub> {
    hubs: {
      repo: {
        find(hubId: string): Promise<THub | null>
        findOrFail(hubId: string): Promise<THub>
        findByServiceExtId(service: string, hubExtId: string): Promise<THub | null>
      }
    },
    access: {
      service: IAccessService
    }
    translations: {
      t: TTranslateFn,
    }
  }

  export type TNodeEnv = "development" | "production" | "test";
  export type TTranslateFn = (code: string, lang: string, values: Record<string, string>, def?: string) => Promise<string>;

  export interface IEnv {
    nodeEnv: TNodeEnv | string;
    instanceId: string;
    logLevel: Logging.LogLevel;
  }

  // export interface IServicesContainer<TMember extends IMember, TUser extends IUser, THub extends IHub> {
  //   // access: IAccessService<TMember, TUser, THub>;
  //   // extUser: IExtUserService<TMember, TUser, THub>;
  //   hub: IHubService<THub>;
  // }

  export interface ICtxFactoryContainer<TMember extends IMember, TUser extends IUser, THub extends IHub> {
    createMemberContext(
      opts: { member: TMember, user: TUser, hub: THub }
    ): Promise<IMemberContext<TMember, TUser, THub>>;
  }

  export type TEventListener = (...args: any[]) => Promise<any> | void;
  export type TDefaultEventMap = {[event in (string|symbol)]: TEventListener};
  export interface IEventEmitter<EventMap extends TDefaultEventMap = TDefaultEventMap> {
    emit<EventKey extends keyof EventMap>(event: EventKey, ...args: Parameters<EventMap[EventKey]>): boolean;
    on<EventKey extends keyof EventMap = string>(event: EventKey, listener: EventMap[EventKey]): this;
  }

  export interface IAccessService {
    can(memberCtx: TMemberCtx, action: string, resource: string): Promise<boolean>;

    hasRole(memberCtx: TMemberCtx, role: string): Promise<boolean>;
    addRole(memberCtx: TMemberCtx, role: string): Promise<boolean>;
    removeRole(memberCtx: TMemberCtx, role: string): Promise<boolean>;

    // roleExists(hubId: string, role: string): Promise<boolean>;
    // createHubRole(hubId: string, role: string): Promise<boolean>;
    // deleteHubRole(hubId: string, role: string): Promise<boolean>;
  }

  export interface IExtUserService<TMember extends IMember, TUser extends IUser, THub extends IHub> {
    findCtx(hubId: string, service: string, extId: string): Promise<IMemberContext<TMember, TUser, THub> | null>;
    findCtxOrFail(hubId: string, service: string, extId: string): Promise<IMemberContext<TMember, TUser, THub>>;
    findOrCreateCtx<TData extends object>(hubId: string, service: string, extId: string, name: string, data: TData): Promise<{ctx: IMemberContext<TMember, TUser, THub>, isUserCreated: boolean, isMemberCreated: boolean}>;
  }

  // export interface IHubService<THub extends IHub> {
  //   find(hubId: string): Promise<THub | null>;
  //   findOrFail(hubId: string): Promise<THub>;
  //   findByExtId(hubExtId: string): Promise<THub | null>
  // }

  // Contexts

  export type TMemberCtx = {
    member: {id: string},
    user: {id: string},
    hub: {id: string},
  }

  export interface IMemberContext<
    TMember extends IMember,
    TUser extends IUser,
    THub extends IHub
  > extends TMemberCtx {
    user: TUser;

    // member role management
    member: TMember;
    hasRole(role: string): Promise<boolean>;
    addRole(role: string): Promise<boolean>;
    removeRole(role: string): Promise<boolean>;

    // club, bot, org, etc
    hub: THub;
    hubEntityName: string;
    hubId: string;

    // integration with external services
    // setMemberExtId(service: string, extId: string, opts?: {force?: boolean}): Promise<void>;
    // memberExtId(service: string): Promise<string>;
    // hubExtId(service: string): Promise<string>;

    // getters
    memberId: string;
    userId: string;
    name: string;
  }

  // Entities

  export interface IMember {
    id: string;
  }

  export interface IUser {
    id: string;
  }

  export interface IHub {
    id: string;
  }
}
