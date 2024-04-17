import App from '../../App'
import {ITaskResult, TaskProcessDaemonLogic} from './TaskProcessDaemonLogic'
import Task, {TaskState} from '../../models/Task'
import {taskProcessors} from './taskProcessors'

export const taskProcessingDaemon = (app: App) => {
  new TaskProcessDaemonLogic(
    {
      log: app.log,

      taskProcessors: taskProcessors(app),

      lockNextTask: async (taskTypes: Array<string>) => {
        const taskTypesRaw = `'${taskTypes.join("','")}'`;

        const tasks: { raw: Array<{ id: string }> } = await app.DB
          .createQueryBuilder()
          .update(Task)
          .set({
            state: TaskState.processing,
            lockedAt: () => "CURRENT_TIMESTAMP",
          })
          .where(
            `id IN (SELECT id FROM "task" WHERE`
            + ` "state" = ${TaskState.pending}`
            + ` AND "taskType" IN (${taskTypesRaw})`
            + ` LIMIT 1)`,
          )
          .returning('id')
          .execute();

        if (tasks.raw.length == 0) {
          return null;
        }

        const taskId = tasks.raw[0].id;

        const task = await app.m.findOne(Task, {
          where: {
            id: taskId,
          },
        });

        return task;
      },

      unlockTask: async (task: Task, taskResult: ITaskResult) => {
        const setData = {
          state: taskResult.state,
        }
        if (taskResult.state === TaskState.done) {
          setData['doneAt'] = () => "CURRENT_TIMESTAMP";
          setData['result'] = taskResult.data;
        } else if (taskResult.state === TaskState.failed) {
          setData['errorAt'] = () => "CURRENT_TIMESTAMP";
          setData['result'] = {...taskResult.data || {}, error: taskResult.error};
        }

        const tasks: { raw: Array<{ id: number }> } = await app.DB
          .createQueryBuilder()
          .update(Task)
          .set(setData)
          .where(
            `"id" = ${task.id}`
            + ` AND "state" = ${TaskState.processing}`
          )
          .returning('id')
          .execute();

        if (tasks.raw.length == 0) {
          app.log.warn('queue daemon: no task to unlock', {data: {task, taskResult}});
        }
      },
    },

    {
      interval: app.Env.taskProcessingInterval,
    }
  ).run();
}
