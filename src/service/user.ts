import { Service } from 'egg';
import { User, MysqlResult } from '../types';

export default class UserService extends Service {
  // 注册
  async register(params: Omit<User, 'id'>): Promise<MysqlResult | null> {
    const { app } = this;
    try {
      const result = await app.mysql.insert('user', params);
      return result;
    } catch (error: any) {
      this.logger.error('Service - User - register - Error:', error.message);
      return null;
    }
  }

  // 通过用户名获取用户信息
  async getUserByName(username: string): Promise<User | null> {
    const { app } = this;
    try {
      const result = await app.mysql.get('user', { username });
      return result as User | null;
    } catch (error: any) {
      this.logger.error('Service - User - getUserByName - Error:', error.message);
      return null;
    }
  }

  // 通过 user_id 获取用户信息
  async getUserById(user_id: number): Promise<User | null> {
    const { app } = this;
    try {
      const result = await app.mysql.get('user', { user_id });
      return result as User | null;
    } catch (error: any) {
      this.logger.error('Service - User - getUserById - Error:', error.message);
      return null;
    }
  }

  async editUserInfo(params: User): Promise<MysqlResult | null> {
    const { app } = this;
    try {
      const result = await app.mysql.update('user', {
        ...params,
      }, {
        id: params.id,
      });
      return result;
    } catch (error: any) {
      this.logger.error('Service - User - editUserInfo - Error:', error.message);
      return null;
    }
  }

  async modifyPass(params: User): Promise<MysqlResult | null> {
    const { app } = this;
    try {
      const result = await app.mysql.update('user', {
        ...params,
      }, {
        id: params.id,
      });
      return result;
    } catch (error: any) {
      this.logger.error('Service - User - modifyPass - Error:', error.message);
      return null;
    }
  }
}
