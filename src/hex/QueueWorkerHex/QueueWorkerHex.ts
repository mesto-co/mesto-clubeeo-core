import {IBricksLogger} from 'bricks-ts-logger'

export interface IQueueWorkerHexCommonApp {
  log: IBricksLogger,
}

export interface IQueueWorkerHexPorts {


  // tgCheckKey: (key) => boolean,
  // approveChatJoinRequest: (tgChatId: number, tgUserId: number) => Promise<void>,
  // declineChatJoinRequest: (tgChatId: number, tgUserId: number) => Promise<void>,
  // isUserAllowed: (tgChatId: number, tgUserId: number) => Promise<boolean>,
  // tgChatStateUpdated: (data: {tgChatId: number, status: string}) => Promise<void>;
}

export class QueueWorkerHex {
  protected app: IQueueWorkerHexCommonApp;
  protected ports: IQueueWorkerHexPorts;

  constructor(deps: {
    app: IQueueWorkerHexCommonApp,
    ports: IQueueWorkerHexPorts,
  }) {
    this.app = deps.app;
    this.ports = deps.ports;
  }

  registerTask() {

  }

  executeTask() {

  }

}


