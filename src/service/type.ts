import { Service } from 'egg';
import { BillType, MysqlResult } from '../types';

export default class TypeService extends Service {
  // 获取标签列表（仅用户自定义类型）
  async list(user_id: string): Promise<BillType[] | null> {
    const { app } = this;
    const QUERY_STR = 'id, name, type, icon, user_id, is_system';
    const sql = `SELECT ${QUERY_STR} FROM type WHERE is_delete = 0 AND user_id = ? ORDER BY id ASC`;
    try {
      const result = await app.mysql.query(sql, [ user_id ]);
      return result as BillType[];
    } catch (error: any) {
      this.logger.error('Service - Type - list - Error:', error.message);
      return null;
    }
  }

  // 获取单个类型详情
  async detail(id: number, user_id: string): Promise<BillType | null> {
    const { app } = this;
    try {
      const result = await app.mysql.query<BillType[]>(
        'SELECT id, name, type, icon, user_id, is_system FROM type WHERE id = ? AND is_delete = 0 AND user_id = ?',
        [ id, user_id ]
      );
      return result && result.length > 0 ? result[0] : null;
    } catch (error: any) {
      this.logger.error('Service - Type - detail - Error:', error.message);
      return null;
    }
  }

  // 添加类型
  async add(params: BillType): Promise<MysqlResult | null> {
    const { app } = this;
    try {
      await app.mysql.query('SET NAMES utf8mb4');
      const result = await app.mysql.insert('type', {
        ...params,
        is_delete: 0,
      });
      return result;
    } catch (error: any) {
      this.logger.error('Service - Type - add - Error:', error.message);
      return null;
    }
  }

  // 更新类型
  async update(params: BillType): Promise<MysqlResult | null> {
    const { app } = this;
    try {
      const sql = 'UPDATE type SET name = ?, type = ?, icon = ? WHERE id = ? AND user_id = ? AND is_delete = 0';
      const result = await app.mysql.query(sql, [ params.name, params.type, params.icon, params.id, params.user_id ]);
      return result as unknown as MysqlResult;
    } catch (error: any) {
      this.logger.error('Service - Type - update - Error:', error.message);
      return null;
    }
  }

  // 软删除类型
  async delete(id: number, user_id: string): Promise<MysqlResult | null> {
    const { app } = this;
    try {
      // 使用软删除，设置 is_delete = 1
      const sql = 'UPDATE type SET is_delete = 1 WHERE id = ? AND user_id = ? AND is_delete = 0';
      const result = await app.mysql.query(sql, [ id, user_id ]);
      return result as unknown as MysqlResult;
    } catch (error: any) {
      this.logger.error('Service - Type - delete - Error:', error.message);
      return null;
    }
  }

  // 批量复制系统预设类型给新用户（用于用户注册时初始化）
  async initUserTypes(user_id: string): Promise<MysqlResult | null> {
    const { app } = this;
    try {
      // 查询所有系统预设类型（user_id='0' 且未删除）
      const systemTypes = await app.mysql.query<BillType[]>(
        'SELECT name, type, icon FROM type WHERE user_id = ? AND is_delete = 0',
        [ '0' ]
      );

      if (!systemTypes || systemTypes.length === 0) {
        return { affectedRows: 0, insertId: 0 } as MysqlResult;
      }

      // 批量插入给新用户
      const insertData = systemTypes.map(item => ({
        name: item.name,
        type: item.type,
        icon: item.icon,
        user_id,
        is_system: 1, // 标记为系统初始化类型
        is_delete: 0,
      }));

      await app.mysql.query('SET NAMES utf8mb4');
      const result = await app.mysql.insert('type', insertData);
      return result;
    } catch (error: any) {
      this.logger.error('Service - Type - initUserTypes - Error:', error.message);
      return null;
    }
  }
}
