import {BaseService} from '../BaseService';
import User from '../../models/User';
import {nanoid} from 'nanoid';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

export class UserManageService extends BaseService {
  async createUser(data: {
    email?: string,
    password?: string,
  }) {
    const hash = data.password ? await bcrypt.hash(data.password, saltRounds) : undefined;

    return await this.app.m.save(
      this.app.m.create(User, {
        email: data.email || undefined,
        password: hash,
        confirmationSecret: nanoid(32),
      })
    );
  }
}
