import { Service } from 'egg';
import { Bill, MysqlResult } from '../types';

interface ListParams {
  id: number;
  orderBy?: string;
  start: string;
  end: string;
  pageNum?: number;
  pageSize?: number;
  isAll?: boolean;
  type_id?: string | number;
}

interface MonthlyQueryParams {
  user_id: number;
  startMonth: string;
  endMonth: string;
}

interface BillListResult {
  result: Bill[];
  total: { 'COUNT(*)': number }[];
  expenseTotal: { 'SUM(amount)': number }[];
  incomeTotal: { 'SUM(amount)': number }[];
}

export default class BillService extends Service {
  // 获取账单列表
  async list({
    id,
    orderBy = 'DESC',
    start,
    end,
    pageNum = 1,
    pageSize = 10,
    isAll = false,
    type_id = '',
  }: ListParams): Promise<BillListResult | null> {
    const { app } = this;

    // 验证 orderBy（白名单）
    const validOrderBy = [ 'ASC', 'DESC' ];
    const safeOrderBy = validOrderBy.includes(orderBy) ? orderBy : 'DESC';

    // 验证数字参数
    const safePageNum = parseInt(String(pageNum)) || 1;
    const safePageSize = parseInt(String(pageSize)) || 10;
    const safeTypeId = parseInt(String(type_id)) || 0;

    // 构建 WHERE 条件
    const whereConditions = [ 'user_id = ?' ];
    const params: (string | number)[] = [ id ];

    if (safeTypeId) {
      whereConditions.push('type_id = ?');
      params.push(safeTypeId);
    }

    const startStr = start.length === 10 ? `${start} 00:00:00` : start;
    const endStr = end.length === 10 ? `${end} 23:59:59` : end;

    whereConditions.push('date BETWEEN ? AND ?');
    params.push(startStr, endStr);

    // 构建主查询 SQL
    let sql = `
      SELECT id, pay_type, amount, date, type_id, type_name, remark
      FROM bill
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY UNIX_TIMESTAMP(date) ${safeOrderBy}, id DESC
    `;

    if (!isAll) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(safePageSize, (safePageNum - 1) * safePageSize);
    }

    // 构建总数查询 SQL
    const baseParams = isAll ? params : params.slice(0, -2);
    const totalSql = `
      SELECT COUNT(*) FROM bill
      WHERE ${whereConditions.join(' AND ')}
    `;
    const totalParams = baseParams;

    // 构建支出总额查询 SQL
    const expenseParams = [ ...baseParams, 1 ];
    const expenseSql = `
      SELECT SUM(amount) FROM bill
      WHERE ${whereConditions.join(' AND ')} AND pay_type = ?
    `;

    // 构建收入总额查询 SQL
    const incomeParams = [ ...baseParams, 2 ];
    const inComeSql = `
      SELECT SUM(amount) FROM bill
      WHERE ${whereConditions.join(' AND ')} AND pay_type = ?
    `;

    try {
      const result = await app.mysql.query<Bill[]>(sql, params);
      const total = await app.mysql.query<{ 'COUNT(*)': number }[]>(totalSql, totalParams);
      const expenseTotal = await app.mysql.query<{ 'SUM(amount)': number }[]>(expenseSql, expenseParams);
      const incomeTotal = await app.mysql.query<{ 'SUM(amount)': number }[]>(inComeSql, incomeParams);
      return { result, total, expenseTotal, incomeTotal };
    } catch (error: any) {
      this.logger.error('Service - Bill - list - Error:', error.message);
      return null;
    }
  }

  async getEarliestItemDate({
    type_id = '',
    user_id = '',
  }: {
    type_id?: string;
    user_id?: string;
  }): Promise<any[] | null> {
    const { app } = this;
    try {
      let sql = 'SELECT MIN(date) as EarliestDate FROM bill WHERE user_id = ?';
      const params: (string | number)[] = [ user_id ];

      if (type_id) {
        sql += ' AND type_id = ?';
        params.push(parseInt(type_id));
      }

      const result = await app.mysql.query(sql, params);
      return result;
    } catch (error: any) {
      this.logger.error('Service - Bill - getEarliestItemDate - Error:', error.message);
      return null;
    }
  }

  async add(params: Bill): Promise<Bill | null> {
    const { app } = this;
    try {
      await app.mysql.query('SET NAMES utf8mb4');
      const result = await app.mysql.insert('bill', params);
      if (result && result.insertId) {
        const bill = await app.mysql.get('bill', { id: result.insertId, user_id: params.user_id });
        return bill as Bill | null;
      }
      return null;
    } catch (error: any) {
      this.logger.error('Service - Bill - add - Error:', error.message);
      return null;
    }
  }

  async batchAdd(params: Bill[]): Promise<MysqlResult | Error> {
    const { app } = this;
    try {
      await app.mysql.query('SET NAMES utf8mb4');
      const result = await app.mysql.insert('bill', params);
      return result;
    } catch (error: any) {
      this.logger.error('Service - Bill - batchAdd - Error:', error.message);
      return new Error('批量添加账单失败');
    }
  }

  async detail(id: number, user_id: number): Promise<Bill | null> {
    const { app } = this;
    try {
      const result = await app.mysql.get('bill', { id, user_id });
      return result as Bill | null;
    } catch (error: any) {
      this.logger.error('Service - Bill - detail - Error:', error.message);
      return null;
    }
  }

  async update(params: Bill): Promise<Bill | null> {
    const { app } = this;
    try {
      await app.mysql.update(
        'bill',
        {
          ...params,
        },
        {
          id: params.id,
          user_id: params.user_id,
        }
      );
      const bill = await app.mysql.get('bill', { id: params.id, user_id: params.user_id });
      return bill as Bill | null;
    } catch (error: any) {
      this.logger.error('Service - Bill - update - Error:', error.message);
      return null;
    }
  }

  async delete(id: number, user_id: number): Promise<MysqlResult | null> {
    const { app } = this;
    try {
      const result = await app.mysql.delete('bill', {
        id,
        user_id,
      });
      return result;
    } catch (error: any) {
      this.logger.error('Service - Bill - delete - Error:', error.message);
      return null;
    }
  }

  async queyBillByMonthly({
    user_id,
    startMonth,
    endMonth,
  }: MonthlyQueryParams): Promise<any[] | null> {
    const { app } = this;
    try {
      const startStr = startMonth.length === 10 ? `${startMonth} 00:00:00` : startMonth;
      const endStr = endMonth.length === 10 ? `${endMonth} 23:59:59` : endMonth;

      const sql = `
        SELECT
          DATE_FORMAT(date, '%Y-%m') AS month,
          SUM(amount) AS total_expense
        FROM bill
        WHERE
          user_id = ?
          AND pay_type = 1
          AND date BETWEEN ? AND ?
        GROUP BY month
        ORDER BY month
      `;
      const result = await app.mysql.query(sql, [ user_id, startStr, endStr ]);
      return result;
    } catch (error: any) {
      this.logger.error('Service - Bill - queyBillByMonthly - Error:', error.message);
      return null;
    }
  }
}
