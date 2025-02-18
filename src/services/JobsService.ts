import {BaseService} from './BaseService'

export default class JobsService extends BaseService {
  run() {
    let lock = false;
    setInterval(async () => {
      if (!lock) {
        try {
          lock = true;

        } catch (e) {
          console.log(e)
        } finally {
          lock = false
        }
      } else {
        console.log('warning: task watcher locked')
      }
    }, 1000)
  }
}
