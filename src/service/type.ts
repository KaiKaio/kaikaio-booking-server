import { Service } from 'egg';
import { BillType } from '../types';

export default class TypeService extends Service {
  // 获取标签列表
  async list(): Promise<BillType[] | null> {
    const { app } = this;
    const QUERY_STR = 'id, name, type, icon';
    const sql = `select ${QUERY_STR} from type`;
    try {
      const result = await app.mysql.query(sql);
      return result as BillType[];
    } catch (error: any) {
      this.logger.error('Service - Type - list - Error:', error.message);
      return null;
    }
  }
}
