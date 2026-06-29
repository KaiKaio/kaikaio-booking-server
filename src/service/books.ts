import { Service } from 'egg';
import { Book, MysqlResult } from '../types';

export default class BooksService extends Service {
  private checkDatabase(): boolean {
    if (!this.app.mysql) {
      this.logger.warn('Database is disabled');
      return false;
    }
    return true;
  }

  async list({ userId }: { userId: number }): Promise<Book[] | null> {
    if (!this.checkDatabase()) return null;
    const { app } = this;

    const sql = 'SELECT id, name FROM books WHERE user_id = ?';

    try {
      const result = await app.mysql.query(sql, [ userId ]);
      return result as Book[];
    } catch (error: any) {
      this.logger.error(error, 'Service - Books - Error');
      return null;
    }
  }

  async add(params: Omit<Book, 'id'>): Promise<MysqlResult | null> {
    if (!this.checkDatabase()) return null;
    const { app } = this;
    try {
      const result = await app.mysql.insert('books', params);
      return result;
    } catch (error: any) {
      this.logger.error(error);
      return null;
    }
  }
}
