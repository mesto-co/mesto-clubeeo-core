import {BaseService} from './BaseService'
import User from '../models/User'
import Post, {IPostEdit} from '../models/Post'
import assert from 'assert'

export class AccessService extends BaseService {
  async require(action: 'create', entity: 'post', user: User, data: unknown) {
    if (action == 'create') {
      if (entity == 'post') {
        const postData = data as IPostEdit;
        assert(postData.clubId, 'clubId is required');
      }
    }
  }
}
