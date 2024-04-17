import App from '../../../src/App'
import {newMemoryDB} from '../../../src/testing/db'
import {Connection} from 'typeorm'
import {AppEnv} from '../../../src/appEnv'
import MotionEngine from '../../../src/engines/MotionEngine/MotionEngine'
import {TaskBuilderLogic} from '../../../src/engines/MotionEngine/TaskBuilderLogic'
import {BypassProcessor} from '../../../src/engines/MotionEngine/triggerProcessors/BypassProcessor'
import {MapProcessor} from '../../../src/engines/MotionEngine/triggerProcessors/MapProcessor'
import {MergeProcessor} from '../../../src/engines/MotionEngine/triggerProcessors/MergeProcessor'
import Event from '../../../src/models/Event'
import Trigger from '../../../src/models/Trigger'
import Club from '../../../src/models/Club'
import User from '../../../src/models/User'
import { expect } from 'chai'
import {StaticProcessor} from '../../../src/engines/MotionEngine/triggerProcessors/StaticProcessor'
import {JavaScriptProcessor} from '../../../src/engines/MotionEngine/triggerProcessors/JavaScriptProcessor'

describe('MotionEngine#taskBuilder', function () {
  let db: Connection;
  let mockApp: App;
  let motionEngine: MotionEngine;
  let taskBuilder: TaskBuilderLogic;
  let club: Club;
  let user: User;

  before(async () => {
    const env = AppEnv.getInstance();
    db = await newMemoryDB();
    mockApp = new App(db, env);
    motionEngine = new MotionEngine(mockApp);

    taskBuilder = new TaskBuilderLogic({
      processors: {
        static: new StaticProcessor(),
        bypass: new BypassProcessor(),
        map: new MapProcessor(),
        javascript: new JavaScriptProcessor(),
        // loader: new LoaderProcessor(mockApp),
      }
    });
    taskBuilder.register('merge', new MergeProcessor(taskBuilder));

    club = await mockApp.em.createAndSave(Club, {name: 'test club', slug: 'test-club'});
    user = await mockApp.em.createAndSave(User, {screenName: 'tester'});
  });

  it('bypass data from trigger.data when taskType="static"', async () => {
    const eventType = 'test:static';

    const event = await mockApp.m.create(Event, {
      eventType,
      club: {id: club.id},
      user: {id: user.id},
      data: {
        source: 'event'
      }
    });

    const trigger = await mockApp.m.create(Trigger, {
      eventType,
      club: {id: club.id},
      enabled: true,
      data: {
        source: 'trigger'
      },
      processor: {
        type: 'static',
      }
    });

    const taskData = await taskBuilder.buildTask({
      trigger,
      event,
    });

    expect(taskData.data).deep.equal({
      source: 'trigger'
    });
  });

  it('bypass data from event.data when taskType="event"', async () => {
    const eventType = 'test:event';

    const event = await mockApp.m.create(Event, {
      eventType,
      club: {id: club.id},
      user: {id: user.id},
      data: {
        source: 'event'
      }
    });

    const trigger = await mockApp.m.create(Trigger, {
      eventType,
      club: {id: club.id},
      enabled: true,
      data: {
        source: 'trigger'
      },
      processor: {
        type: 'bypass',
      }
    });

    const taskData = await taskBuilder.buildTask({
      trigger,
      event,
    });

    expect(taskData.data).deep.equal({
      source: 'event'
    });
  });

  it('maps data from event.data when taskType="map"', async () => {
    const eventType = 'test:map';

    const event = await mockApp.m.create(Event, {
      eventType,
      club: {id: club.id},
      user: {id: user.id},
      data: {
        source: 'event',
        deep: {
          data: 'deepDataValue'
        }
      }
    });

    const trigger = await mockApp.m.create(Trigger, {
      eventType,
      club: {id: club.id},
      enabled: true,
      processor: {
        type: 'map',
        opts: {
          map: {
            mappedFrom: 'source',
            deepData: 'deep.data',
            'left.side.deepData': 'deep.data',
          }
        }
      }
    });

    const taskData = await taskBuilder.buildTask({
      trigger,
      event,
    });

    expect(taskData.data).deep.equal({
      mappedFrom: 'event',
      deepData: 'deepDataValue',
      left: {
        side: {
          deepData: 'deepDataValue'
        }
      }
    });
  });

  it('maps data from event.data when taskType="javascript"', async () => {
    const eventType = 'test:javascript';

    const event = await mockApp.m.create(Event, {
      eventType,
      club: {id: club.id},
      user: {id: user.id},
      data: {
        source: 'event',
        hidden: 'field',
      }
    });

    const trigger = await mockApp.m.create(Trigger, {
      eventType,
      club: {id: club.id},
      enabled: true,
      processor: {
        type: 'javascript',
        opts: {
          code: '{"eventSource": event.source}'
        }
      }
    });

    const taskData = await taskBuilder.buildTask({
      trigger,
      event,
    });

    expect(taskData.data).deep.equal({
      eventSource: 'event'
    });
  });
});
