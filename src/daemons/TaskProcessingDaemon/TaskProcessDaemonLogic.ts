import {IBricksLogger} from 'bricks-ts-logger'
import Task, {TaskState} from '../../models/Task'

type TTaskProcessor = (task: Task) => Promise<ITaskResult>;

export type ITaskResult = ({
  state: TaskState.done
} | {
  state: TaskState.failed
  error: string
}) & {data?: Record<string, any>}

interface ITaskProcessDaemon_Deps {
  lockNextTask: (taskTypes: Array<string>) => Promise<Task | null>,
  unlockTask: (task: Task, processingResult: ITaskResult) => Promise<void>,
  taskProcessors: Record<string, TTaskProcessor>,
  log: IBricksLogger,
}

export class TaskProcessDaemonLogic {
  protected lock: boolean;
  protected interval: number;
  protected deps: ITaskProcessDaemon_Deps;

  constructor(
    deps: ITaskProcessDaemon_Deps,
    opts: {
      interval: number,
    }) {
    this.lock = false;
    this.interval = opts.interval;
    this.deps = deps;
  }

  // addTaskProcessor(taskProcessor: TTaskProcessor) {
  //   if (this.taskProcessors[taskProcessor.taskType]) {
  //     this.app.log.warn('taskProcessor already registered', {data: taskProcessor.taskType});
  //   }
  //
  //   this.taskProcessors[taskProcessor.taskType] = taskProcessor;
  // }

  run() {
    this.deps.log.info('TaskProcessDaemonLogic started');

    const taskTypes = Object.keys(this.deps.taskProcessors);

    if (taskTypes.length == 0) {
      this.deps.log.warn('no taskProcessors registered, but TaskProcessDaemonLogic#run called');
    }

    setInterval(async () => {
      if (!this.lock) {
        let currentTask: Task = null;

        try {
          this.lock = true;
          currentTask = null; //for error handling

          const task = await this.deps.lockNextTask(taskTypes);

          if (!task) {
            // wait for the next task;
            return;
          }
          currentTask = task; //for error handling

          const taskProcessor = this.deps.taskProcessors[task.taskType];
          if (!taskProcessor) {
            this.deps.log.warn('no taskProcessor found for taskType', {data: {task, taskType: task.taskType}});
            await this.deps.unlockTask(task, {state: TaskState.failed, error: 'no taskProcessor'});
            return;
          }

          try {
            const result = await taskProcessor(task);

            //todo: write reason / error /result
            await this.deps.unlockTask(task, result);
          } catch (e) {
            const stack = e.stack;

            this.deps.log.warn(e.message, {
              data: {
                error: e.toString(),
                stack,
                currentTask,
              }});

            //todo: write reason / error /result
            await this.deps.unlockTask(task, {
              state: TaskState.failed,
              error: e.toString(),
              data: {stack},
            });
          }

        } catch (e) {
          this.deps.log.error(e.message, {data: {error: e.toString(), currentTask}})
        } finally {
          this.lock = false
        }
      }
    }, this.interval)
  }
}
