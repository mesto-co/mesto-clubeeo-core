import {IEventInput, IProcessor, IAction, ITrigger} from './ActionBuilderInterfaces'

export class ActionBuilderLogic {
  protected processors: Record<string, IProcessor>

  constructor(deps: {processors: Record<string, IProcessor>}) {
    this.processors = deps.processors;
  }

  register(slug: string, processor: IProcessor) {
    this.processors[slug] = processor;
  }

  async buildAction(opts: { trigger: ITrigger, event: IEventInput }): Promise<IAction> {
    const processorType = opts.trigger?.processor?.type;
    const processor = this.processors[processorType];
    if (!processor) throw Error(`processor ${processorType} is not found`);

    const result = await processor.exec({ ...opts, config: opts.trigger?.processor || {}}); //opts.eventInput.data

    return {
      actionType: result.actionType,
      data: result.data,
    }
  }
}
