import { Service } from 'egg';
import { User, MysqlResult } from '../types';

export default class UserService extends Service {
  private checkDatabase(): boolean {
    if (!this.app.mysql) {
      this.logger.warn('Database is disabled');
      return false;
    }
    return true;
  }

  async register(params: Omit<User, 'id'>): Promise<MysqlResult | null> {
    if (!this.checkDatabase()) return null;
    const { app } = this;
    try {
      const result = await app.mysql.insert('user', params);
      return result;
    } catch (error: any) {
      this.logger.error('Service - User - register - Error:', error.message);
      return null;
    }
  }

  async getUserByName(username: string): Promise<User | null> {
    if (!this.checkDatabase()) return null;
    const { app } = this;
    try {
      const result = await app.mysql.get('user', { username });
      return result as User | null;
    } catch (error: any) {
      this.logger.error('Service - User - getUserByName - Error:', error.message);
      return null;
    }
  }

  async getUserById(user_id: number): Promise<User | null> {
    if (!this.checkDatabase()) return null;
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
    if (!this.checkDatabase()) return null;
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
    if (!this.checkDatabase()) return null;
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
