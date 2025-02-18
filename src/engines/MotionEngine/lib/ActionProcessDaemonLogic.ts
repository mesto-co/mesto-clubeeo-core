import {IBricksLogger} from 'bricks-ts-logger'
import MotionAction, {MotionActionState} from '../models/MotionAction'

export type TActionProcessor = (action: MotionAction) => Promise<IActionResult>;

export type IActionResult = ({
  state: MotionActionState.done
} | {
  state: MotionActionState.failed
  error: string
}) & {data?: Record<string, any>}

interface IActionProcessDaemon_Deps {
  lockNextAction: (actionTypes?: Array<string>) => Promise<MotionAction | null>,
  unlockAction: (action: MotionAction, processingResult: IActionResult) => Promise<void>,
  getActionProcessor: (action: MotionAction) => Promise<TActionProcessor>,
  log: IBricksLogger,
}

export default class ActionProcessDaemonLogic {
  protected lock: boolean;
  protected interval: number;
  protected deps: IActionProcessDaemon_Deps;

  constructor(
    deps: IActionProcessDaemon_Deps,
    opts: {
      interval: number,
    }) {
    this.lock = false;
    this.interval = opts.interval;
    this.deps = deps;
  }

  run() {
    this.deps.log.info('ActionProcessDaemonLogic started');

    setInterval(async () => {
      if (!this.lock) {
        let currentAction: MotionAction = null;

        try {
          this.lock = true;
          currentAction = null; //for error handling

          const action = await this.deps.lockNextAction();

          if (!action) {
            // wait for the next action;
            return;
          }
          currentAction = action; //for error handling

          const actionProcessor = await this.deps.getActionProcessor(action);
          if (!actionProcessor) {
            this.deps.log.warn('no actionProcessor found for actionType', {data: {action, actionType: action.actionType}});
            await this.deps.unlockAction(action, {state: MotionActionState.failed, error: 'no actionProcessor'});
            return;
          }

          try {
            const result = await actionProcessor(action);

            //todo: write reason / error /result
            await this.deps.unlockAction(action, result);
          } catch (e) {
            const stack = e.stack;

            this.deps.log.warn(e.message, {
              data: {
                error: e.toString(),
                stack,
                currentAction,
              }});

            //todo: write reason / error /result
            await this.deps.unlockAction(action, {
              state: MotionActionState.failed,
              error: e.toString(),
              data: {stack},
            });
          }

        } catch (e) {
          this.deps.log.error(e.message, {data: {error: e.toString(), currentAction}})
        } finally {
          this.lock = false
        }
      }
    }, this.interval)
  }
}
