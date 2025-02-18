import App from '../App'
import Club from '../models/Club'
import {snippets} from '../snippets/snippets'
import User from '../models/User'

export class ClubWidgetFactory {
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  async build(widgetLocator: string, context: { user: User, club: Club }) {
    if (widgetLocator.startsWith('onboarding-task:')) { // temporary hardcode
      const [widgetType, taskId] = widgetLocator.split(':');

      if (taskId === 'root') {
        const stepsSnippet = await snippets.onboardingTasks(this.app, taskId, context.club, context.user);

        return {
          view: stepsSnippet,
          widgetLocator: `${widgetType}:${taskId}`,
        };
      } else {
        return this.errorView(`Unknown taskId "${taskId}"`);
      }
    } else {
      return this.errorView(`Unknown widgetLocator "${widgetLocator}"`);
    }
  }

  protected errorView(message: string) {
    return {
      error: message,
      view: {
        type: 'html',
        text: message,
      },
    }
  }
}
