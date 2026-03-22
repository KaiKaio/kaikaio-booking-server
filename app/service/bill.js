'use strict';

const Service = require('egg').Service;

class BillService extends Service {

  // 获取账单列表
  async list({ id, orderBy = 'DESC', start, end, pageNum, pageSize, isAll = false, type_id = '' }) {
    const { app } = this;

    // 验证 orderBy（白名单）
    const validOrderBy = [ 'ASC', 'DESC' ];
    if (!validOrderBy.includes(orderBy)) {
      orderBy = 'DESC';
    }

    // 验证数字参数
    pageNum = parseInt(pageNum) || 1;
    pageSize = parseInt(pageSize) || 10;
    type_id = parseInt(type_id) || 0;

    // 构建 WHERE 条件
    const whereConditions = [ 'user_id = ?' ];
    const params = [ id ];

    if (type_id) {
      whereConditions.push('type_id = ?');
      params.push(type_id);
    }

    whereConditions.push('date BETWEEN ? AND ?');
    params.push(start, end);

    // 构建主查询 SQL
    let sql = `
      SELECT id, pay_type, amount, date, type_id, type_name, remark
      FROM bill
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY UNIX_TIMESTAMP(date) ${orderBy}, id DESC
    `;

    if (!isAll) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(pageSize, (pageNum - 1) * pageSize);
    }

    // 构建总数查询 SQL
    const totalSql = `
      SELECT COUNT(*) FROM bill
      WHERE ${whereConditions.join(' AND ')}
    `;
    const totalParams = params.slice(0, -isAll ? 2 : 0);

    // 构建支出总额查询 SQL
    const expenseParams = [ ...params.slice(0, -isAll ? 2 : 0), 1 ];
    const expenseSql = `
      SELECT SUM(amount) FROM bill
      WHERE ${whereConditions.join(' AND ')} AND pay_type = ?
    `;

    // 构建收入总额查询 SQL
    const incomeParams = [ ...params.slice(0, -isAll ? 2 : 0), 2 ];
    const inComeSql = `
      SELECT SUM(amount) FROM bill
      WHERE ${whereConditions.join(' AND ')} AND pay_type = ?
    `;

    try {
      const result = await app.mysql.query(sql, params);
      const total = await app.mysql.query(totalSql, totalParams);
      const expenseTotal = await app.mysql.query(expenseSql, expenseParams);
      const incomeTotal = await app.mysql.query(inComeSql, incomeParams);
      return { result, total, expenseTotal, incomeTotal };
    } catch (error) {
      console.log('Service - Bill - list - Error:', error.message);
      return null;
    }
  }

  async getEarliestItemDate({ type_id = '', user_id = '' }) {
    const { app } = this;
    try {
      let sql = 'SELECT MIN(date) as EarliestDate FROM bill WHERE user_id = ?';
      const params = [ user_id ];

      if (type_id) {
        sql += ' AND type_id = ?';
        params.push(parseInt(type_id));
      }

      const result = await app.mysql.query(sql, params);
      return result;
    } catch (error) {
      console.log('Service - Bill - getEarliestItemDate - Error:', error.message);
      return null;
    }
  }

  async add(params) {
    const { app } = this;
    try {
      await app.mysql.query('SET NAMES utf8mb4');
      const result = await app.mysql.insert('bill', params);
      return result;
    } catch (error) {
      console.log('Service - Bill - add - Error:', error.message);
      return null;
    }
  }

  async batchAdd(params) {
    const { app } = this;
    try {
      await app.mysql.query('SET NAMES utf8mb4');
      const result = await app.mysql.insert('bill', params);
      return result;
    } catch (error) {
      console.log('Service - Bill - batchAdd - Error:', error.message);
      return null;
    }
  }

  async detail(id, user_id) {
    const { app } = this;
    try {
      const result = await app.mysql.get('bill', { id, user_id });
      return result;
    } catch (error) {
      console.log('Service - Bill - detail - Error:', error.message);
      return null;
    }
  }

  async update(params) {
    const { app } = this;
    try {
      const result = await app.mysql.update('bill', {
        ...params,
      }, {
        id: params.id,
        user_id: params.user_id,
      });
      return result;
    } catch (error) {
      console.log('Service - Bill - update - Error:', error.message);
      return null;
    }
  }

  async delete(id, user_id) {
    const { app } = this;
    try {
      const result = await app.mysql.delete('bill', {
        id,
        user_id,
      });
      return result;
    } catch (error) {
      console.log('Service - Bill - delete - Error:', error.message);
      return null;
    }
  }

  async queyBillByMonthly({ user_id, startMonth, endMonth }) {
    const { app } = this;
    try {
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
      const result = await app.mysql.query(sql, [ user_id, startMonth, endMonth ]);
      return result;
    } catch (error) {
      console.log('Service - Bill - queyBillByMonthly - Error:', error.message);
      return null;
    }
  }
}

module.exports = BillService;
